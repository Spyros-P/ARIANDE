import cv2
import numpy as np
import networkx as nx
import matplotlib.pyplot as plt
from rtree import index
from shapely.geometry import Polygon, LineString, Point
from shapely.strtree import STRtree
from scipy.interpolate import make_interp_spline, splprep, splev
import pickle
from typing import Tuple, List, Literal, Callable, Dict
import json
from inference_sdk import InferenceHTTPClient
if __name__ == '__main__':
    from functions import *
else:
    from scripts.functions import *
from tqdm import tqdm
import tempfile
from skimage.filters import threshold_multiotsu
import random

MatLike = np.ndarray


class SmartGraph:
    # Graph Nodes contain the index of each node in smart graph except of the smart doors
    graph_index: index.Index = None
    graph_index_dict: Dict[int, Tuple[int,int]] = None
    # Graph contains the nodes and edges of the smart graph
    graph: nx.Graph = None
    # JIT edges contain the index of the smart doors
    jit_edges: Dict[int, List[Tuple[Tuple[int|str, int|str], float]]] = None
    geometries: STRtree = None
    graph_nodes: Dict[int, Tuple[int,int]] = None

    def __init__(self, graph: nx.Graph, hot_nodes: List[int], geometries: STRtree):
        """
        Initialize the SmartGraph.

        Parameters
        graph: A NetworkX graph.
        doors: A list of door node indices.
        """
        self.geometries = geometries

        # Copy the graph to avoid mutating the original
        self.graph = graph.copy()

        # Dictionary to store edges connected to hot nodes
        hot_info = { i: { 'coords': self.graph.nodes[node]['pos'],
                          'original_node': node,
                          'connections' : [],
                          'subgraphs' : set()
                          } for i, node in enumerate(hot_nodes) }
        
        # Check for hot nodes with connections to each other
        for node in hot_nodes:
            if any(neighbor in hot_nodes for neighbor in self.graph.neighbors(node)):
                raise ValueError('Hot nodes should not have a connection to each other')

        # Process hot nodes
        for i, node_dict in hot_info.items():
            # Get edges connected to the hot node
            connected_edges = list(self.graph.edges(node_dict['original_node'], data=True))
            hot_info[i]['connections'] = [
                (edge[1], edge[2]['weight']) for edge in connected_edges
            ]
            # Remove the hot node from the graph
            self.graph.remove_node(node_dict['original_node'])

        # Identify connected components (subgraphs)
        subgraphs = list(nx.connected_components(self.graph))


        counter = max(self.graph.nodes) + 1
        hot_len = len(hot_nodes)
        sub_len = len(subgraphs)


        # Create a mapping of nodes to their subgraphs
        for idx, subgraph_nodes in enumerate(subgraphs):
            for node in subgraph_nodes:
                self.graph.nodes[node]['subgraph'] = idx
        
        hot_nodes_subgraphs = {}
        for i, node_dict in hot_info.items():
            connected_nodes = [ node for node, _ in node_dict['connections'] ]
            # Get a set of subgraphs connected to the hot node
            subgraph_set = set(self.graph.nodes[node]['subgraph'] for node in connected_nodes)
            for sbg_id in list(subgraph_set):
                if sbg_id not in hot_nodes_subgraphs:
                    hot_nodes_subgraphs[sbg_id] = set()
                hot_nodes_subgraphs[sbg_id].add(i)
            hot_info[i]['subgraphs'] = subgraph_set
            # Create nodes
            for subgraph in subgraph_set:
                self.graph.add_node(counter+i*sub_len+subgraph, pos=node_dict['coords'], subgraph=subgraph)
        
        # Create connections between hot nodes and subgraphs
        for i, node_dict in hot_info.items():
            for node, weight in node_dict['connections']:
                subgraph = self.graph.nodes[node]['subgraph']
                self.graph.add_edge(counter+i*sub_len+subgraph, node, weight=weight)

        # Create a spatial index for the graph nodes
        self.graph_index = index.Index()
        self.graph_index_dict = {}
        for node, data in self.graph.nodes(data=True):
            x, y = data.get('pos')
            self.graph_index.insert(node, (x, y, x, y))
            self.graph_index_dict[node] = (x, y)

        # Create a new node for each subgraph or smart graph structure
        for i in hot_info:
            self.graph.add_node(counter+hot_len*sub_len+i, pos=hot_info[i]['coords'])
        # Connect the smart nodes to each other if they belong to the same subgraph
        smart_counter = counter+hot_len*sub_len+hot_len
        for nodes in hot_nodes_subgraphs.values():
            for i in nodes:
                for j in nodes:
                    if i != j:
                        # Calculate the weight between the smart nodes based on the distance between in the original graph
                        path = nx.shortest_path(graph, source=hot_info[i]['original_node'], target=hot_info[j]['original_node'], weight='weight')
                        path_points = [graph.nodes[node].get('pos') for node in path]
                        # Shorten the path. Cut points if the new path does not intersect with any geometry
                        indexes = shrink_path(path_points, geometries)
                        path_points = [path_points[k] for k in indexes]
                        path = [path[k] for k in indexes]
                        # Add smart nodes if the do not exist
                        for node, pos in zip(path[1:-1], path_points[1:-1]):
                            if smart_counter+node not in self.graph.nodes:
                                self.graph.add_node(smart_counter+node, pos=pos)
                        # Connect the smart nodes if they do not have an edge
                        for idx in range(len(path) - 1):
                            node1 = smart_counter+path[idx] if idx>0 else counter+hot_len*sub_len+i
                            node2 = smart_counter+path[idx+1] if idx<len(path)-2 else counter+hot_len*sub_len+j
                            if not self.graph.has_edge(node1, node2):
                                weight = np.linalg.norm(np.array(path_points[idx]) - np.array(path_points[idx+1]))
                                self.graph.add_edge(node1, node2, weight=weight)

        # Cache the graph nodes
        self.graph_nodes = { node: self.graph.nodes[node].get('pos') for node in self.graph.nodes }
        
        # Create JIT edges
        self.jit_edges = {}
        for subgraph, nodes in hot_nodes_subgraphs.items():
            jit_edges = []
            for i in nodes:
                jit_edges.append(((counter+hot_len*sub_len+i, counter+i*sub_len+subgraph), 0))
            self.jit_edges[subgraph] = jit_edges

    def find_path(self, start: Tuple[float,float], end: Tuple[float,float]):
        # Find the nearest nodes to the start and end points
        start_near = next(self.graph_index.nearest((start[0], start[1], start[0], start[1]), 1))
        end_near = next(self.graph_index.nearest((end[0], end[1], end[0], end[1]), 1))

        # Find the subgraph that contains the start and end nodes
        subgraph_start = self.graph.nodes[start_near].get('subgraph')
        subgraph_end = self.graph.nodes[end_near].get('subgraph')
    
        # Define the heuristic function for A* (Euclidean distance)
        def heuristic(node1: int, node2: int) -> float:
            pos1 = np.array(self.graph_nodes[node1])
            pos2 = np.array(self.graph_nodes[node2])
            return np.linalg.norm(pos1 - pos2)

        if subgraph_start != subgraph_end:
            # Connect JIT edges
            jit_edges_start = self.jit_edges[subgraph_start]
            jit_edges_end = self.jit_edges[subgraph_end]

            # Connect JIT edges to the main graph
            for jit_edge, weight in jit_edges_start:
                self.graph.add_edge(jit_edge[0], jit_edge[1], weight=weight)
            for jit_edge, weight in jit_edges_end:
                self.graph.add_edge(jit_edge[0], jit_edge[1], weight=weight)

        # Find the shortest path using A* algorithm
        path = nx.astar_path(self.graph, source=start_near, target=end_near, heuristic=heuristic, weight='weight')

        # Extract the path points
        path_points = [self.graph_nodes[node] for node in path]

        # Calculate the total distance of the path
        distance = sum([self.graph.edges[path[i], path[i+1]]['weight'] for i in range(len(path) - 1)])

        if subgraph_start != subgraph_end:
            # Remove JIT edges
            for jit_edge, _ in jit_edges_start:
                self.graph.remove_edge(jit_edge[0], jit_edge[1])
            for jit_edge, _ in jit_edges_end:
                self.graph.remove_edge(jit_edge[0], jit_edge[1])

        return path_points, distance

    def plot_graph(self, image, indexes=None, rand_seed=42, save_file=None):
        image = image.copy()

        # image to rgb
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)

        # get the subgraphs of the graph
        subgraphs = [self.graph.subgraph(c).copy() for c in nx.connected_components(self.graph)]
        # set random seed get the colors
        if rand_seed is not None:
            random.seed(rand_seed)
            colors = [(random.randint(30, 225), random.randint(30, 225), random.randint(30, 225)) for _ in range(len(subgraphs))]

        # draw edges
        if indexes is None:
            plot_subgraphs = subgraphs[:-1]
            if rand_seed is not None:
                plot_colors = colors[:-1]
            else:
                plot_colors = [(255, 0, 0) for _ in range(len(subgraphs) - 1)]
        else:
            plot_subgraphs = [subgraphs[i] for i in indexes]
            if rand_seed is not None:
                plot_colors = [colors[i] for i in indexes]
            else:
                plot_colors = [(255, 0, 0) for _ in indexes]
        
        def tuple_to_int(tup):
            return tuple(int(x) for x in tup)
        
        for subgraph, color in zip(plot_subgraphs, plot_colors):
            for edge in subgraph.edges:
                cv2.line(image, tuple_to_int(subgraph.nodes[edge[0]]['pos']), tuple_to_int(subgraph.nodes[edge[1]]['pos']), color, 2)

        # draw nodes
        for subgraph in plot_subgraphs:
            for node in subgraph.nodes:
                cv2.circle(image, tuple_to_int(self.graph.nodes[node].get('pos')), 7, (0, 0, 255), -1)

        if save_file:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            cv2.imwrite(save_file, image_rgb)
        else:
            plt.figure(figsize=(20, 20))
            plt.imshow(image)
            plt.axis('off')
            plt.show()


class Indoor_Navigation:
    # Class variables
    name: str = None
    icon = None
    image_original = None
    image = None
    image_upscale = None
    walls = None
    doors = None
    walls_doors = None
    pixel_to_cm = None
    graph: SmartGraph = None
    contours: STRtree = None
    rooms = None
    # TODO: Deprecate this
    scale = 4

    _debug_ = False

    def __init__(self,
                 image_path: str,
                 icon_path: str = None,
                 name: str = None,
                 debug = False):
        """
        A class that represents an indoor navigation system
        """
        self.name = name
        # TODO: Load the icon
        self.image_original = cv2.imread(image_path)
        self._debug_ = debug
        # if self._debug_:
        #     self.plot_image(self.image_original)
    
    def calibrate(self, pixel_to_cm: float):
        """
        A function that calibrates the pixel to meters ratio
        """
        self.pixel_to_cm = pixel_to_cm
    
    def process_image(self, grid_size=30, radius=2.3, doors=None, rooms=None):
        """
        A function that processes the image
        """
        pbar = tqdm(total=7, desc="Overall Progress", unit="task")

        pbar.write("Initial image process...")
        self.image = clean_image(self.image_original)
        # if self._debug_:
        #     self.plot_image(self.image)
        # TODO: Implement the upscale factor based on the pixel_to_cm ratio
        # Darken black pixels
        filters = [threshold(70, 255, 'tozero')
                   ]
        image = apply_filters(self.image, filters)
        self.image_upscale = upscale_image(image)
        # if self._debug_:
        #     self.plot_image(self.image_upscale)
        self.image_upscale = sharpen_image(self.image_upscale, kernel=3)
        # if self._debug_:
        #     self.plot_image(self.image_upscale)
        pbar.update(1)
        pbar.write("Detecting walls...")
        self.walls = self.detect_walls(self.image_upscale, self.pixel_to_cm)
        # if self._debug_:
        #     self.plot_image(self.walls)
        pbar.update(1)
        pbar.write("Detecting doors...")
        self.doors, self.walls, self.walls_doors = self.detect_doors(doors=doors)
        # if self._debug_:
        #     self.plot_image(self.walls)
        # if self._debug_:
        #     self.plot_image(self.walls_doors)
        self.graph, self.graph_nodes, self.contours = self.generate_graph(grid_size=grid_size, radius=radius, rooms=rooms, pbar=pbar)
        pbar.update(1)
        pbar.close()

    def calculate_route(self,
                        start: Tuple[float, float],
                        end: Tuple[float, float],
                        algorithm: Literal['dijkstra', 'astar'] = 'astar',
                        in_pixels: bool = False,
                        simplify_route=True
                        ) -> Tuple[List[Tuple[float, float]], float]:
        """
        A function that calculates the shortest path between two points
        
        Parameters
        ----------
        start : The start point as a tuple (x, y)
        end : The end point as a tuple (x, y)
        algorithm : The algorithm to use for path calculation. Either 'dijkstra' or 'astar'
        in_pixels : If True, the start and end points are in pixels.
            If False, the start and end points are in relative coordinates (from 0 to 1).
            Also, the output path will be in relative coordinates if in_pixels is False.

        Returns
        -------
        path_points : List of tuples representing the path points
        distance : The total distance of the path in meters        
        """

        if not in_pixels:
            image_shape = self.image_upscale.shape
            start = (start[0] * image_shape[1], start[1] * image_shape[0])
            end = (end[0] * image_shape[1], end[1] * image_shape[0])

        path_points, distance = self.graph.find_path(start, end)

        if not in_pixels:
            path_points = [(point[0] / image_shape[1], point[1] / image_shape[0]) for point in path_points]

        return path_points, self.pixels_to_cm(distance, scale=4)

    def save(self, path: str) -> None:
        """A function that saves the object to a file"""
        # Drop the graph_index from smart graph
        self.graph.graph_index = None
        with open(path, 'wb') as f:
            pickle.dump(self, f)

    def predict_rooms(self, confidence=0.7):
        return None
    
    def post_rooms_labeled(self, rooms):
        self.rooms = rooms

    def get_json(self, save_path: str = None) -> None:
        """
        A function that returns the JSON representation of the object
        or saves it to a file if save_path is provided
        """

        # TODO: Implement primary nodes, labels, rooms, floor
        data = { node : {"edges" : [], "label" : self.graph.nodes[node].get('label'), "coords" : self.graph_nodes[node], "primary" : True} for node in self.graph.nodes }

        for i, j in self.graph.edges:
            data[i]["edges"].append(j)
            data[j]["edges"].append(i)

        json_graph = []

        # get items of dictionary
        for i, j in data.items():
            dict_i = {
                "id" : i,
                "edges" : j["edges"],
                "label" : j["label"],
                "imageX" : j["coords"][0]/self.scale,
                "imageY" : j["coords"][1]/self.scale,
                "primary" : j["primary"],
                "floor" : 0
            }
            json_graph.append(dict_i)
        
        # TODO: Implement room labels
        json_rooms = [
            {
                "label": label,
                "floor": 0,
                "coords": [{"x": x/self.scale, "y": y/self.scale} for x, y in room.exterior.coords]
            }
            for label, room in self.rooms.items()
        ]

        json_data = {
            "Distance_Per_Pixel" : self.pixel_to_cm,
            "Graph" : json_graph,
            "Rooms" : json_rooms,
            "Floors" : 1
        }

        if save_path:
            with open(save_path, 'w') as f:
                json.dump(json_data, f, indent=4)
        else:
            return json_data

    @classmethod
    def load(self, path: str) -> None:
        """A function that loads the object from a file"""
        with open(path, 'rb') as f:
            obj = pickle.load(f)
        # Create the spatial index for the graph nodes
        obj.graph.graph_index = index.Index()
        for node, pos in obj.graph.graph_index_dict.items():
            obj.graph.graph_index.insert(node, (pos[0], pos[1], pos[0], pos[1]))
        return obj
        
    def report(self) -> str:
        """A function to report image resolution, graph nodes, and graph edges, etc"""
        return (
            f"Report for Indoor Navigation Object:\n"
            f"-Name: {self.name}\n"
            f"-Image resolution: {self.image.shape}\n"
            f"-Number of graph nodes: {len(self.graph_nodes)}\n"
            f"-Number of graph edges: {len(self.graph.edges)}"
        )
    
    def plot_route(self, path_points: List[Tuple[float, float]], distance: float, in_pixels: bool = False) -> None:
        """A function that plots the path on the floor plan"""
        if not in_pixels:
            image_shape = self.image.shape
            path_points = [(int(point[0] * image_shape[1]), int(point[1] * image_shape[0])) for point in path_points]
        plt.imshow(self.image, cmap='gray')
        # Connect lines between the points
        for i in range(len(path_points) - 1):
            x = [path_points[i][0], path_points[i + 1][0]]
            y = [path_points[i][1], path_points[i + 1][1]]
            plt.plot(x, y, 'b-', markersize=1)
        for i in path_points:
            plt.plot(i[0], i[1], 'ro', markersize=2)
        plt.title('Shortest Path on Floor Plan\nDistance: {:.2f} meters'.format(distance))
        plt.show()
    
    def calculate_and_plot_route(self,
                                 start: Tuple[float, float],
                                 end: Tuple[float, float],
                                 algorithm: Literal['dijkstra', 'astar'] = 'astar',
                                 in_pixels: bool = False,
                                 simplify_route=True) -> None:
        """A function that calculates and plots the shortest path between two points"""
        path_points, distance = self.calculate_route(start, end, algorithm, in_pixels, simplify_route)
        self.plot_route(path_points, distance, in_pixels)
    
    def predict_class(self, classes, confidence=0.7):
        """
        A function that predicts the class of an image using a trained model
        """
        CLIENT = InferenceHTTPClient(
            api_url="https://outline.roboflow.com",
            api_key="mQL45QHB1lZ19v2mKuf1"
        )

        # Save the image to a temporary file
        with tempfile.NamedTemporaryFile(suffix='.png') as temp_file:
            image_path = temp_file.name
            cv2.imwrite(image_path, self.image_upscale)

            # predictions = CLIENT.infer(image_path, model_id="full-set-menu/5")['predictions']
            predictions = CLIENT.infer(image_path, model_id="doors-windows-detection/4")['predictions']

        # Filter the predictions to get the classes
        classes = [p for p in predictions if p['class'] in classes and p['confidence'] > confidence]

        return classes

    def detect_doors(self, doors=None, confidence=0.7):
        """
        A function that detects doors in the image
        This function returns the centers of the doors, an image of walls with doors erased, and an image of doors erased with doors closed
        """
        if doors is None:
            with tempfile.NamedTemporaryFile(suffix='.png') as temp_file:
                image_path = temp_file.name
                cv2.imwrite(image_path, self.image_upscale)
                predictions = model_predict(image_path)
                classes = ['DOOR-SINGLE', 'DOOR-DOUBLE']
                doors = [p for p in predictions if p['class'] in classes and p['confidence'] > confidence]
        else:
            doors = [{'x': door['x'] * self.scale, 'y': door['y'] * self.scale, 'width': door['width'] * self.scale, 'height': door['height'] * self.scale} for door in doors]

        image_doors_erased = self.walls.copy()
        # TODO: Implemet door closing
        image_doors = self.walls.copy()
        door_centers = []

        factor = 1.1
        for i, door in enumerate(doors):
            x, y, width, height = door['x'], door['y'], door['width'], door['height']

            x1 = int(x - width * factor / 2)
            y1 = int(y - height * factor / 2)
            x2 = int(x + width * factor / 2)
            y2 = int(y + height * factor / 2)

            # Set coordinates to the image boundaries
            x1_temp = max(0, x1)
            y1_temp = max(0, y1)
            x2_temp = min(image_doors_erased.shape[1], x2)
            y2_temp = min(image_doors_erased.shape[0], y2)
            # TODO: Remove this later
            x1 = min(x1_temp, x2_temp)
            y1 = min(y1_temp, y2_temp)
            x2 = max(x1_temp, x2_temp)
            y2 = max(y1_temp, y2_temp)


            img_doors = self.image_upscale[y1:y2, x1:x2]
            try:
                # apply gaussian blur
                img_doors = cv2.GaussianBlur(img_doors, (5, 5), 0)
            except:
                print('Error in door detection')
                print('x1:', x1, 'y1:', y1, 'x2:', x2, 'y2:', y2)
                print()
                raise ValueError('Error in door detection')

            # Define the number of classes you want to segment the image into
            num_classes = 3  # For example, segmenting into 3 classes

            # Compute multi-level Otsu's thresholds
            thresholds = threshold_multiotsu(img_doors, classes=num_classes)
            # print(thresholds)

            # Keep the 2nd class and white background
            door_mask = cv2.inRange(img_doors, int(thresholds[0]), 255)
            # dilation
            door_mask = cv2.dilate(door_mask, kernel(5), iterations=1)
            # apply mask
            image_doors_erased[y1:y2, x1:x2] = cv2.bitwise_or(image_doors_erased[y1:y2, x1:x2], door_mask)

            # Add the door center to the list
            door_centers.append((x, y))
        
        return door_centers, image_doors_erased, image_doors
        
    # TODO: Implement the pixel_to_cm
    def detect_walls(self, image, pixel_to_cm):
        # Apply gaussian blur and thresholding
        filters = [
            gaussian_blur((5,5), 0),
            threshold(240, 255)
            ]
        return apply_filters(image, filters)
    
    # TODO: this works for certain image dimensions. make it robust to upscale and downscale images
    def plot_image(self, image: MatLike, with_rooms=False, with_graph=False, save_file=None) -> None:
        """A function that plots the image"""
        if with_rooms:
            rooms, _ = cv2.findContours(self.walls_doors, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

            # reject small contours
            rooms = [room for room in rooms if cv2.contourArea(room) > 500]
            rooms = [room for room in rooms if cv2.contourArea(room) < 10000000]

            # reject contours that circulate black areas
            def is_black_area(contour, image):
                # create a mask with the contour
                mask = np.zeros_like(image)
                cv2.drawContours(mask, [contour], -1, 255, cv2.FILLED)
                # erode the mask
                mask = cv2.erode(mask, kernel(5), iterations=1)
                # a random black point of mask
                point = np.where(mask == 255)
                # check if the point is black
                return image[point[0][0], point[1][0]] == 0


            rooms = [room for room in rooms if not is_black_area(room, self.walls_doors)]    

            print('Number of rooms:', len(rooms))

            """A function that plots the rooms on the floor plan"""
            # Create an image to draw the colored contours
            contour_image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

            # Get a colormap
            colormap = plt.get_cmap('prism', len(rooms))

            # Draw each contour with a different color and fill the inside
            for i, contour in enumerate(rooms):
                color = tuple(int(c * 255) for c in colormap(i)[:3])  # Convert colormap color to BGR
                cv2.drawContours(contour_image, [contour], -1, color, thickness=cv2.FILLED)

            # if image has 3 channels
            is_colored = len(image.shape) == 3

            # Convert the original image to RGB
            if is_colored:
                original_image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                original_image_rgb = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)

            # Create a mask where the contours are drawn
            mask = np.zeros_like(contour_image, dtype=np.uint8)
            for i, contour in enumerate(rooms):
                color = (255, 255, 255)  # White color for the mask
                cv2.drawContours(mask, [contour], -1, color, thickness=cv2.FILLED)

            # Blend the contour image with the original image using the mask
            alpha = 0.5  # Transparency factor
            plot_image = cv2.addWeighted(original_image_rgb, 1 - alpha, contour_image, alpha, 0)
        else:
            plot_image = image


        if save_file:
            cv2.imwrite(save_file, plot_image)
        else:
            # if image has 3 channels
            is_colored = len(plot_image.shape) == 3

            plt.figure(figsize=(15, 15))
            if is_colored:
                plt.imshow(cv2.cvtColor(plot_image, cv2.COLOR_BGR2RGB))
            else:
                plt.imshow(plot_image, cmap='gray')
            plt.axis('off')
            plt.show()

    def calculate_contours(self):
        """
        A function that calculates the contours of the image
        """
        # Find the contours of the walls and doors
        contours, _ = cv2.findContours(self.walls_doors, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        self.building = contours[0]
        self.rooms = contours[1:]

        # Reject small contours
        self.rooms = [room for room in self.rooms if cv2.contourArea(room) > 500]
        self.rooms = [room for room in self.rooms if cv2.contourArea(room) < 10000000]

        # Reject contours that circulate black areas
        def is_black_area(contour, image):
            # Create a mask with the contour
            mask = np.zeros_like(image)
            cv2.drawContours(mask, [contour], -1, 255, cv2.FILLED)
            # Erode the mask
            mask = cv2.erode(mask, kernel(5), iterations=1)
            # A random black point of mask
            point = np.where(mask == 255)
            # Check if the point is black
            return image[point[0][0], point[1][0]] == 0

        self.rooms = [room for room in self.rooms if not is_black_area(room, self.walls_doors)]
        print('Number of rooms:', len(self.rooms))

        # Convert the contours to Shapely Polygons
        self.rooms = [Polygon(room.squeeze()) for room in self.rooms]

    def get_contours_and_filter(self, image, threshold=30, fill_black=False):
        # Add a margin to the image
        margin = 10
        image_margin = cv2.copyMakeBorder(image, margin, margin, margin, margin, cv2.BORDER_CONSTANT, value=255)
        # Apply image dilation
        # image_margin = cv2.erode(image_margin, kernel(20), iterations=1)
        # Invert image in order not to avoid image border contour
        image_margin = cv2.bitwise_not(image_margin)
        contours, _ = cv2.findContours(image_margin, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        image_margin = cv2.bitwise_not(image_margin)


        if fill_black:
            # Prepare the structuring element (kernel) only once
            ker = kernel(5)

            mask_margin = 5

            filtered_contours = []
            rejected_contours = []

            for contour in contours:
                # Get the bounding rectangle for this contour
                x, y, w, h = cv2.boundingRect(contour)

                # Skip if the bounding box is empty (shouldn't happen in normal cases, but just a safeguard)
                if w == 0 or h == 0:
                    continue

                x_new = max(x - mask_margin, 0)
                y_new = max(y - mask_margin, 0)
                w_new = min(w + mask_margin + x-x_new, image_margin.shape[1] - x)
                h_new = min(h + mask_margin + y-y_new, image_margin.shape[0] - y)
                
                # Extract the ROI from the original image
                sub_image_margin = image_margin[y_new:y_new+h_new, x_new:x_new+w_new]

                # Create a local mask the size of the bounding box
                mask_roi = np.full((h_new, w_new), 255, dtype=np.uint8)

                # Shift the contour so it fits exactly in the local mask
                contour_shifted = contour - [x_new, y_new]

                # Draw the contour on the local mask (fill with 0 = black)
                cv2.drawContours(mask_roi, [contour_shifted], -1, 0, thickness=cv2.FILLED)

                # Dilate the mask locally
                mask_roi = cv2.dilate(mask_roi, ker, iterations=1)

                # Combine the sub-image with the mask
                region = cv2.bitwise_or(sub_image_margin, mask_roi)

                # Check if there's any black pixel in the region
                # If so, we keep this contour
                if np.any(region == 0):
                    filtered_contours.append(contour)
                else:
                    rejected_contours.append(contour)

            # Fill the contours with black color
            cv2.drawContours(image_margin, rejected_contours, -1, 0, cv2.FILLED)

            contours = filtered_contours

        filtered_contours = []
        rejected_contours = []

        for c in contours:
            if cv2.contourArea(c) > threshold:
                filtered_contours.append(c)
            else:
                rejected_contours.append(c)

        contours = filtered_contours

        # Fill the contours with white color
        cv2.drawContours(image_margin, rejected_contours, -1, 255, cv2.FILLED)
    
        # remove margin
        image_margin = image_margin[margin:-margin, margin:-margin]

        # substract (margin,margin) from the contours
        contours = [c - [margin, margin] for c in contours]

        # create polygon tree
        st = STRtree([Polygon(c.squeeze()) for c in contours])

        return image_margin, st

    def generate_graph(self, rooms=None, grid_size=30, radius=2.3, pbar=None):
        """
        A function that generates a graph based on the image
        """
        if pbar is not None:
            pbar.write("Creating Contours...")
            pbar.update(1)
        if rooms is not None:
            rooms_dict = {}
            for room in rooms:
                points = room['points']
                # Convert points to a list of tuples for Shapely Polygon
                polygon_points = [(point['x']*self.scale, point['y']*self.scale) for point in points]
                # Create a Shapely Polygon
                rooms_dict[room['label']] = Polygon(polygon_points)
        
            self.rooms = rooms_dict

        walls_filtered, contours_walls = self.get_contours_and_filter(self.walls, fill_black=False)

        walls_doors = cv2.bitwise_and(walls_filtered, self.walls_doors)

        walls_doors_filtered, contours_walls_doors = self.get_contours_and_filter(walls_doors)

        img_copy = walls_filtered.copy()
        # to RGB
        img_copy = cv2.cvtColor(img_copy, cv2.COLOR_GRAY2RGB)
        # draw each contour with a different color
        for i, contour in enumerate(contours_walls.geometries):
            import random
            color = (random.randint(50, 220), random.randint(50, 220), random.randint(50, 220))
            # polygon to cv2 contour
            contour = np.array(contour.exterior.coords, dtype=np.int32)
            cv2.drawContours(img_copy, [contour], -1, color, thickness=2)
        cv2.imwrite('presentation/contours.png', img_copy)
        raise ValueError('Stop here')

        if pbar is not None:
            pbar.write("Placing graph nodes...")
            pbar.update(1)

        # Stage 6: Place the nodes on the image
        # Define the grid size
        self.grid_size = grid_size

        # Create nodes at the center of each grid cell
        nodes = []
        for i in range(grid_size, self.image_upscale.shape[1], grid_size):
            for j in range(grid_size, self.image_upscale.shape[0], grid_size):
                nodes.append((i, j))

        # Reject nodes that are on walls and doors
        valid_nodes = [node for node in nodes if walls_doors_filtered[node[1], node[0]] == 255]

        # Stage 7: Create a graph based on the nodes
        # Connect the nodes to form a graph based on a threshold distance
        # Each node can be connected to its neighbors within a certain distance
        G = nx.Graph()
        # Add nodes to the graph and create spatial index
        idx = index.Index()
        positions = {}
        for i, node in enumerate(valid_nodes):
            if self.rooms is not None:
                # Check if the node is inside a room
                node_point = Point(node)
                # TODO: Optimize this part, use STRtree. Also to this part at the end of the graph generation process (less nodes)
                for room, polygon in self.rooms.items():
                    if polygon.contains(node_point):
                        G.add_node(i, pos=node, label=room)
                        break
                else:
                    G.add_node(i, pos=node, label='Unknown')
            else:
                G.add_node(i, pos=node, label='Unknown')
            positions[i] = node
            idx.insert(i, (node[0], node[1], node[0], node[1]))

        if pbar is not None:
            pbar.write("Connecting graph edges...")
            pbar.update(1)

        # Connect nodes if close enough and no intersection with contours
        for i, pos_i in positions.items():
            # Get the nearby nodes
            nearby_nodes = list(idx.nearest((pos_i[0], pos_i[1], pos_i[0], pos_i[1]), 50))  # Adjust the number based on needed proximity
            # Calculate distances once and store them in a dictionary
            distances_dict = {x: np.linalg.norm(np.array(pos_i) - np.array(positions[x])) for x in nearby_nodes}
            # Sort nearby_nodes based on the precomputed distances
            nearby_nodes = sorted(nearby_nodes, key=lambda x: distances_dict[x])
            # filter out nodes that are too far
            nearby_nodes = [x for x in nearby_nodes if distances_dict[x] <= grid_size * radius]
            for j in nearby_nodes:
                if i >= j:
                    continue
                pos_j = positions[j]
                vector = np.array(pos_j) - np.array(pos_i)
                vector //= grid_size
                # gcd of the vector components is 1, add the edge
                if np.gcd(vector[0], vector[1]) != 1:
                    continue

                line = LineString([pos_i, pos_j])
                # Efficient query to check if there are any intersecting polygons
                if not any(True for _ in contours_walls_doors.query(line, 'crosses')):
                    G.add_edge(i, j, weight=distances_dict[j])

        # Add the doors
        nodes_count = len(G.nodes)
        door_positions = {}
        for i, door in enumerate(self.doors):
            G.add_node(i + nodes_count, pos=door, label='Door')
            positions[i + nodes_count] = door
            #idx.insert(i + nodes_count, (door[0], door[1], door[0], door[1]))
            door_positions[i + nodes_count] = door

        # Connect the doors to the graph
        for i, pos_i in door_positions.items():
            # Get the nearby nodes
            nearby_nodes = list(idx.nearest((pos_i[0], pos_i[1], pos_i[0], pos_i[1]), 50))
            # Calculate distances once and store them in a dictionary
            distances_dict = {x: np.linalg.norm(np.array(pos_i) - np.array(positions[x])) for x in nearby_nodes}
            # Sort nearby_nodes based on the precomputed distances
            nearby_nodes = sorted(nearby_nodes, key=lambda x: distances_dict[x])
            # filter out nodes that are too far
            nearby_nodes = [x for x in nearby_nodes if distances_dict[x] <= grid_size * 3]
            for j in nearby_nodes:
                pos_j = positions[j]
                line = LineString([pos_i, pos_j])
                # Efficient query to check if there are any intersecting polygons
                if not any(True for _ in contours_walls.query(line, 'crosses')):
                    G.add_edge(i, j, weight=distances_dict[j])


        # Isolate the largest connected component
        largest_cc = max(nx.connected_components(G), key=len)
        G = G.subgraph(largest_cc).copy()

        # Keep the doors that are in the largest connected component
        door_positions = {i: pos for i, pos in door_positions.items() if i in G.nodes}


        if pbar is not None:
            pbar.write("Creating smart graph...")
            pbar.update(1)


        smartG = SmartGraph(G, list(door_positions.keys()), contours_walls)
        

        return smartG, None, contours_walls

    # TODO: implement this in order to avoid putting manually the scale factor
    def cm_to_pixels(self, cm, scale=1):
        # Convert centimeters to pixels
        return cm / self.pixel_to_cm * scale

    # TODO: implement this in order to avoid putting manually the scale factor
    def pixels_to_cm(self, pixels, scale=1):
        # Convert pixels to centimeters
        return pixels * self.pixel_to_cm / scale



## For testing purposes ##
if __name__ == '__main__':

    navigation = Indoor_Navigation('assets/images/hospital_1.jpg',
                                    'Fancy Hospital',
                                    debug=True)
    navigation.calibrate(0.00148)
    navigation.process_image(grid_size=120)

    # navigation.graph.plot_graph(navigation.image_upscale)

    plt.figure(figsize=(10, 10))
    navigation.calculate_and_plot_route(start=(0.8, 0.1),
                                        end=(0.7, 0.9),
                                        algorithm='astar',
                                        in_pixels=False,
                                        simplify_route=True)

    # plot graph
    # image = navigation.image_upscale.copy()
    # graph = navigation.graph

    # navigation = Indoor_Navigation('assets/images/floor_plan_1.jpg',
    #                                 'Fancy Hospital',
    #                                 debug=True)
    # navigation.calibrate(0.00148)
    # navigation.process_image(grid_size=100)

    # # plot graph
    # image = navigation.image_upscale.copy()
    # graph = navigation.graph



    # # image to rgb
    # image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)

    # # draw edges
    # for i, j in graph.edges:
    #     cv2.line(image, navigation.graph_nodes[i], navigation.graph_nodes[j], (255, 0, 0), 2)
    # # draw nodes
    # for node in navigation.graph_nodes:
    #     cv2.circle(image, node, 7, (0, 0, 255), -1)

    # plt.figure(figsize=(20, 20))
    # plt.imshow(image)
    # plt.show()

    # navigation.plot_graph()
    #navigation.plot_graph()
    # print(navigation.report())
    # navigation.plot_rooms()
    # navigation = Indoor_Navigation('static/floor_plan_1.jpg',
    #                            'Demo floor plan',
    #                            grid_size=10)
    #navigation.calculate_and_plot_route((0, 0), (1, 1))
    # navigation.save('static/navigation.pkl')

    # navigation.save_json('navigation.json')



