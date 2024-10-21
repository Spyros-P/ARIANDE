import cv2
import numpy as np
import networkx as nx
import matplotlib.pyplot as plt
from rtree import index
from shapely.geometry import Polygon, LineString
from scipy.interpolate import make_interp_spline, splprep, splev
import pickle
from typing import Tuple, List, Literal, Callable

MatLike = np.ndarray

class Indoor_Navigation:
    def __init__(self,
                 image_path: str,
                 name: str = None,
                 blur: List[Callable[[MatLike], MatLike]] = None,
                 threshold: List[Callable[[MatLike], MatLike]] = None,
                 grid_size: int = 10):
        """
        A class that represents an indoor navigation system
        """
        self.name = name
    
        # Stage 1: Initial image processing
        self.image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

        # Stage 2: Blurring the image
        blur = [gaussian_blur((17, 17), 7)] if blur is None else blur
        self.blurred = apply_filters(self.image, blur)
        
        # Stage 3: Thresholding the image
        threshold = [adaptive_threshold(81, 5),
                     morph_close(kernel(9)),
                     morph_dilate(kernel(5), 2)] if threshold is None else threshold
        self.thresholded = apply_filters(self.blurred, threshold)

        # Stage 4: Find contours of the features
        self.contours, _ = cv2.findContours(self.thresholded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Stage 5: Find the contours of the buildings
        # Use adaptive thresholding to handle different lighting conditions in the image
        threshold = [morph_close(kernel(3)),
                     morph_open(kernel(80)),
                     adaptive_threshold(21, 51),
                     morph_open(kernel(3)),
                     morph_close(kernel(20))]
        image_thresh = apply_filters(self.image, threshold)

        contours, _ = cv2.findContours(image_thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        self.building = contours[0]
        self.rooms = contours[1:]

        # Stage 6: Place the nodes on the image
        # Define the grid size
        self.grid_size = grid_size

        # Create a grid
        grid = np.zeros_like(self.image)
        for i in range(grid_size, self.image.shape[1], grid_size):
            cv2.line(grid, (i, 0), (i, self.image.shape[0]), 255, 1)
        for i in range(grid_size, self.image.shape[0], grid_size):
            cv2.line(grid, (0, i), (self.image.shape[1], i), 255, 1)

        # Create nodes at the center of each grid cell
        nodes = []
        for i in range(grid_size, self.image.shape[1], grid_size):
            for j in range(grid_size, self.image.shape[0], grid_size):
                nodes.append((i, j))

        # Reject nodes that are within the contours
        valid_nodes = [node for node in nodes if not any(cv2.pointPolygonTest(contour, (node[0], node[1]), False) > 0 for contour in self.contours)]

        # Reject nodes that are outside of building
        valid_nodes = [node for node in valid_nodes if cv2.pointPolygonTest(self.building, (node[0], node[1]), False) >= 0]

        # Stage 7: Create a graph based on the nodes
        # Connect the nodes to form a graph based on a threshold distance
        # Each node can be connected to its neighbors within a certain distance
        G = nx.Graph()
        for i, node in enumerate(valid_nodes):
            G.add_node(i, pos=node)

        # Add nodes to the graph and create spatial index
        idx = index.Index()
        positions = {}
        for i, node in enumerate(valid_nodes):
            G.add_node(i)
            positions[i] = node
            idx.insert(i, (node[0], node[1], node[0], node[1]))

        # Convert contours to Shapely Polygons for efficient intersection checks
        self.obstacles = [Polygon(c.squeeze()) for c in self.contours]

        # Connect nodes if close enough and no intersection with contours
        for i, pos_i in positions.items():
            nearby_nodes = list(idx.nearest((pos_i[0], pos_i[1], pos_i[0], pos_i[1]), 50))  # Adjust the number based on needed proximity
            # Calculate distances once and store them in a dictionary
            distances_dict = {x: np.linalg.norm(np.array(pos_i) - np.array(positions[x])) for x in nearby_nodes}
            # Sort nearby_nodes based on the precomputed distances
            nearby_nodes = sorted(nearby_nodes, key=lambda x: distances_dict[x])
            # filter out nodes that are too far
            nearby_nodes = [x for x in nearby_nodes if distances_dict[x] < grid_size * 2.3]
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
                if not does_line_intersect_contour(line, self.obstacles):
                    G.add_edge(i, j, weight=distances_dict[j])

        # Isolate the largest connected component
        largest_cc = max(nx.connected_components(G), key=len)
        G = G.subgraph(largest_cc).copy()

        # Get the new valid nodes
        self.graph_nodes = [positions[i] for i in G.nodes]

        # Create a mapping from the original node labels to new labels
        mapping = {old_label: new_label for new_label, old_label in enumerate(G.nodes())}

        self.G = nx.relabel_nodes(G, mapping)

    def calculate_route(self,
                        start: Tuple[float, float],
                        end: Tuple[float, float],
                        algorithm: Literal['dijkstra', 'astar'] = 'astar',
                        in_pixels: bool = False
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
            image_shape = self.image.shape
            start = (int(start[0] * image_shape[1]), int(start[1] * image_shape[0]))
            end = (int(end[0] * image_shape[1]), int(end[1] * image_shape[0]))

        # Find the nearest nodes to the start and end points
        start_node = min(self.graph_nodes, key=lambda x: np.sqrt((x[0] - start[0])**2 + (x[1] - start[1])**2))
        end_node = min(self.graph_nodes, key=lambda x: np.sqrt((x[0] - end[0])**2 + (x[1] - end[1])**2))

        # Find the shortest path
        if algorithm == 'dijkstra':
            path = nx.shortest_path(self.G, source=self.graph_nodes.index(start_node), target=self.graph_nodes.index(end_node), weight='weight')
        elif algorithm == 'astar':
            # Heuristic function for A* (Euclidean distance)
            def heuristic(node1: Tuple[int, int], node2: Tuple[int, int]) -> float:
                x1, y1 = self.G.nodes[node1]['pos']
                x2, y2 = self.G.nodes[node2]['pos']
                return ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5

            # Find the shortest path using A* algorithm
            path = nx.astar_path(self.G, source=self.graph_nodes.index(start_node), target=self.graph_nodes.index(end_node), heuristic=heuristic, weight='weight')
        else:
            raise ValueError('Invalid algorithm. Choose either "dijkstra" or "astar"')
        
        # Calculate the total weight of the path
        distance = sum(self.G[u][v]['weight'] for u, v in zip(path, path[1:]))

        path_points = [self.graph_nodes[i] for i in path]

        # add starting and ending nodes to the path
        if in_pixels:
            start_point = start
            end_point = end
        else:
            start_point = (start[0] / image_shape[1], start[1] / image_shape[0])
            end_point = (end[0] / image_shape[1], end[1] / image_shape[0])

        # Check if start and end points can be connected directly to the path
        start_line = LineString([start_point, path_points[0]])
        end_line = LineString([end_point, path_points[-1]])
        if not does_line_intersect_contour(start_line, self.obstacles):
            path_points.insert(0, start_point)
        if not does_line_intersect_contour(end_line, self.obstacles):
            path_points.append(end_point)
        
        # Try skipping path points. Check if removing a point the path will pass through a contour
        i = 0
        j = len(path_points) - 1
        z = 0
        
        while i < j - 1:
            if z % 2 == 0:
                # Check from the start
                line = LineString([path_points[i], path_points[i + 2]])
                if not does_line_intersect_contour(line, self.obstacles):
                    path_points.pop(i + 1)
                    j -= 1
                else:
                    i += 1
            else:
                # Check from the end
                line = LineString([path_points[j], path_points[j - 2]])
                if not does_line_intersect_contour(line, self.obstacles):
                    path_points.pop(j - 1)
                    j -= 1
                else:
                    j -= 1
            
            z += 1
        
        i = 0
        while i < len(path_points) - 2:
            line = LineString([path_points[i], path_points[i + 2]])
            if not does_line_intersect_contour(line, self.obstacles):
                path_points.pop(i+1)
            else:
                i += 1

        if not in_pixels:
            path_points = [(x / image_shape[1], y / image_shape[0]) for(x, y) in path_points]

        # Calculate the total distance of the path in meters by summing the the euclidean distances between the points
        distance = sum([np.linalg.norm(np.array(i) - np.array(j)) for i, j in zip(path_points, path_points[1:])])

        return path_points, distance


    def save(self, path: str) -> None:
        """A function that saves the object to a file"""
        with open(path, 'wb') as f:
            pickle.dump(self, f)
    

    @classmethod
    def load(self, path: str) -> None:
        """A function that loads the object from a file"""
        with open(path, 'rb') as f:
            obj = pickle.load(f)
        return obj
        

    def report(self) -> str:
        """A function to report image resolution, graph nodes, and graph edges, etc"""
        return (
            f"Report for Indoor Navigation Object:\n"
            f"-Name: {self.name}\n"
            f"-Image resolution: {self.image.shape}\n"
            f"-Number of graph nodes: {len(self.graph_nodes)}\n"
            f"-Number of graph edges: {len(self.G.edges)}"
        )

    def plot_image(self) -> None:
        """A function that plots the floor plan image"""
        plt.imshow(self.image, cmap='gray')
        plt.title('Floor Plan')
        plt.show()
    
    def plot_blurred_image(self) -> None:
        """A function that plots the blurred image"""
        plt.imshow(self.blurred, cmap='gray')
        plt.title('Blurred Image')
        plt.show()
    
    def plot_thresholded_image(self) -> None:
        """A function that plots the thresholded image"""
        plt.imshow(self.thresholded, cmap='gray')
        plt.title('Thresholded Image')
        plt.show()
    
    def plot_contours(self) -> None:
        """A function that plots the contours on the floor plan"""
        # Display the contours to check what's being detected
        contour_image = cv2.cvtColor(self.image, cv2.COLOR_GRAY2BGR)
        cv2.drawContours(contour_image, self.contours, -1, (0, 255, 0), 1)
        cv2.drawContours(contour_image, self.buildings, -1, (0, 0, 255), 2)
        plt.imshow(contour_image)
        plt.title('Detected Contours')
        plt.show()
    
    def plot_rooms(self) -> None:
        """A function that plots the rooms on the floor plan"""
        # Create an image to draw the colored contours
        contour_image = cv2.cvtColor(self.image, cv2.COLOR_GRAY2BGR)

       # Get a colormap
        colormap = plt.get_cmap('rainbow', len(self.rooms))

        # Draw each contour with a different color and fill the inside
        for i, contour in enumerate(self.rooms):
            color = tuple(int(c * 255) for c in colormap(i)[:3])  # Convert colormap color to BGR
            cv2.drawContours(contour_image, [contour], -1, color, thickness=cv2.FILLED)

        # Convert the original image to RGB
        original_image_rgb = cv2.cvtColor(self.image, cv2.COLOR_GRAY2RGB)

        # Create a mask where the contours are drawn
        mask = np.zeros_like(contour_image, dtype=np.uint8)
        for i, contour in enumerate(self.rooms):
            color = (255, 255, 255)  # White color for the mask
            cv2.drawContours(mask, [contour], -1, color, thickness=cv2.FILLED)

        # Blend the contour image with the original image using the mask
        alpha = 0.5  # Transparency factor
        blended_image = cv2.addWeighted(original_image_rgb, 1 - alpha, contour_image, alpha, 0)

        # Plot the blended image
        plt.imshow(blended_image)
        plt.title('Room Detection')
        plt.axis('off')  # Hide axes for better visualization
        plt.show()

    def plot_graph(self) -> None:
        """A function that plots the graph on the floor plan"""
        # Draw the graph on the image
        pos = nx.get_node_attributes(self.G, 'pos')
        nx.draw(self.G, pos, node_color='red', with_labels=False, node_size=15)
        plt.imshow(self.image, cmap='gray')
        plt.title('Graph on Floor Plan')
        plt.show()
    
    def plot_route(self, path_points: List[Tuple[float, float]], distance: float, in_pixels: bool = False) -> None:
        """A function that plots the path on the floor plan"""
        if not in_pixels:
            image_shape = self.image.shape
            path_points = [(int(point[0] * image_shape[1]), int(point[1] * image_shape[0])) for point in path_points]
        plt.imshow(self.image, cmap='gray')
        for i in path_points:
            plt.plot(i[0], i[1], 'ro', markersize=1)
        plt.title('Shortest Path on Floor Plan\nDistance: {:.2f} meters'.format(distance))
        plt.show()
    
    def calculate_and_plot_route(self,
                                 start: Tuple[float, float],
                                 end: Tuple[float, float],
                                 algorithm: Literal['dijkstra', 'astar'] = 'astar',
                                 in_pixels: bool = False) -> None:
        """A function that calculates and plots the shortest path between two points"""
        path_points, distance = self.calculate_route(start, end, algorithm, in_pixels)
        self.plot_route(path_points, distance, in_pixels)


# Helper functions
def gaussian_blur(kernel, sigma) -> Callable[[MatLike], MatLike]:
    def func(image):
        return cv2.GaussianBlur(image, kernel, sigma)
    return func

def morph_dilate(kernel, iterations = 1) -> Callable[[MatLike], MatLike]:
    def func(image):
        return cv2.dilate(image, kernel, iterations)
    return func

def morph_erode(kernel, iterations = 1) -> Callable[[MatLike], MatLike]:
    def func(image):
        return cv2.erode(image, kernel, iterations)
    return func

# def threshold(thresh, type) -> Callable[[MatLike], MatLike]:
#     def func(image):
#         _, threshed = cv2.threshold(image, thresh, 255, type)
#         return threshed
#     return func

def adaptive_threshold(block_size, C) -> Callable[[MatLike], MatLike]:
    def func(image):
        return cv2.adaptiveThreshold(image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, block_size, C)
    return func

def morph_open( kernel) -> Callable[[MatLike], MatLike]:
    def func(image):
        return cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel)
    return func

def morph_close(kernel) -> Callable[[MatLike], MatLike]:
    def func(image):
        return cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel)
    return func

def apply_filters(image, filters) -> MatLike:
    result = image
    for f in filters:
        result = f(result)
    return result

def kernel(size) -> np.ndarray:
    return np.ones((size, size), np.uint8)

def invert(image) -> MatLike:
    return cv2.bitwise_not(image)

def does_line_intersect_contour(line, contour_polygons):
    """Function to check if a line segment intersects any contour"""
    line_obj = LineString(line)
    return any(line_obj.intersects(p) for p in contour_polygons)


## For testing purposes ##
if __name__ == '__main__':
    # navigation = Indoor_Navigation('static/floor_plan_1.jpg',
    #                                'Demo floor plan')
    
    # print(navigation.report())
    # navigation.plot_rooms()
    navigation = Indoor_Navigation('static/floor_plan_1.jpg',
                               'Demo floor plan',
                               grid_size=10)
    #navigation.calculate_and_plot_route((0, 0), (1, 1))
    navigation.save('static/navigation.pkl')