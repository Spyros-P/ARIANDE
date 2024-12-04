import React, { useRef, useState } from "react";
import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import { DestinationsSearchBar } from "../../components/DestinationsSearchBar/DestinationsSearchBar";
import { s } from "./MainPage.style";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Image, Dimensions } from "react-native";
import ImageZoom from "react-native-image-pan-zoom";
import { useSQLiteContext } from "expo-sqlite";
import { faBullseye } from "@fortawesome/free-solid-svg-icons";
import { fetchFloorPlanByID } from "../../db/db_queries";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { WeightedGraph } from "../../utils/dijkstra";
import { Svg, Line } from "react-native-svg";
import {
  computeLabels,
  computePrimaryNodeForDestination,
  nearestNodeFromCurrentLocation,
  pixelsFromNodeID,
} from "../../utils/manageFloorPlanGraph.js";
export function MainPage({ provideYourScreenName, route }) {
  const imageZoomRef = useRef(null);
  const db = useSQLiteContext();
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [floorPlan, setFloorPlan] = useState({
    base64: "",
    width: 0,
    height: 0,
    graph: [],
  });
  const [currentPosition, setCurrentPosition] = useState({ x: 200, y: 200 });
  const [zoomScale, setZoomScale] = useState(1);
  const [isFloorButtonsDisabled, setIsFloorButtonsDisabled] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [labels, setLabels] = useState([]);
  const [pathEdges, setPathEdges] = useState([]);
  const [pathLength, setPathLength] = useState(0);
  const [destinationPixels, setDestinationPixels] = useState({
    x: -100,
    y: -100,
  });

  useFocusEffect(
    React.useCallback(() => {
      const FetchMap = async (id) => {
        try {
          const res = await fetchFloorPlanByID(db, id);
          res?.floorPlanBase64
            ? setFloorPlan({
                base64: res.floorPlanBase64,
                width: res.floorPlanWidth,
                height: res.floorPlanHeight,
                graph: JSON.parse(res.graph),
              })
            : setFloorPlan({ base64: "", width: 0, height: 0, graph: [] });
          let JSONGraph = {};
          if (res.graph) {
            JSONGraph = JSON.parse(res.graph);
          }

          if (JSONGraph.Floors && JSONGraph.Rooms) {
            setIsFloorButtonsDisabled(JSONGraph.Floors < 2);
            setRooms(JSONGraph.Rooms);
            setLabels(computeLabels(JSONGraph.Rooms));
          }
        } catch (error) {
          console.log(error);
        }
      };
      provideYourScreenName("MainPage");
      if (route.params?.CardId) {
        FetchMap(route.params?.CardId);
      }
    }, [route.params?.CardId])
  );
  const doSomething = () => {
    setDropdownVisible(false);
    Keyboard.dismiss();
  };
  const centerOnCoordinate = (x, y) => {
    if (imageZoomRef.current) {
      imageZoomRef.current.centerOn({
        x: floorPlan.width / 2 - x,
        y: floorPlan.height / 2 - y,
        scale: 2,
        duration: 1,
      });
    }
  };
  const onSelectDestination = (destination) => {
    console.log(destination);
    var graph = new WeightedGraph();
    graph.constructGraph(
      floorPlan.graph.Graph,
      floorPlan.graph.Distance_Per_Pixel
    );
    let currentPositionNode = nearestNodeFromCurrentLocation(
      currentPosition,
      floorPlan.graph.Graph
    ).nearestNode;
    let destinationNode = computePrimaryNodeForDestination(
      destination,
      floorPlan.graph.Graph
    );
    let results = graph.Dijkstra(currentPositionNode, destinationNode);
    setDestinationPixels(
      pixelsFromNodeID(destinationNode, floorPlan.graph.Graph)
    );
    setPathLength(results.length);
    let edges = [];
    let prevNode = currentPositionNode;
    results.path.forEach((nextNode) => {
      edges.push([
        prevNode === currentPositionNode
          ? currentPosition
          : pixelsFromNodeID(prevNode, floorPlan.graph.Graph),
        pixelsFromNodeID(nextNode, floorPlan.graph.Graph),
      ]);
      prevNode = nextNode;
    });
    setPathEdges(edges);
  };
  return (
    <TouchableWithoutFeedback onPress={doSomething}>
      <View style={s.main}>
        <View style={s.searchBar}>
          <DestinationsSearchBar
            fixedItem={"Emergency Exit"}
            isDropdownVisible={isDropdownVisible}
            setDropdownVisible={setDropdownVisible}
            destinations={labels}
            onSelectDestination={onSelectDestination}
          />
        </View>
        <View style={s.imageOverlayContainer}>
          <ImageZoom
            ref={imageZoomRef}
            cropWidth={Dimensions.get("window").width}
            cropHeight={Dimensions.get("window").height}
            imageWidth={floorPlan.width} // Set your image width here, or adjust dynamically
            imageHeight={floorPlan.height} // Set your image height here, or adjust dynamically
            onStartShouldSetPanResponder={() => true}
            panToMove={true} // Allow panning
            pinchToZoom={true} // Allow pinch zoom
            enableCenterFocus={false} // Disable automatic centering
            useNativeDriver={true}
            minScale={1}
            maxScale={4}
            centerOn={{
              x: floorPlan.width / 2 - currentPosition.x,
              y: floorPlan.height / 2 - currentPosition.y,
              scale: 2,
              duration: 1,
            }}
            onMove={(props) => setZoomScale(props.scale)}
          >
            <Image
              style={{ width: floorPlan.width, height: floorPlan.height }} // Ensure image takes full screen
              source={{ uri: `${floorPlan.base64}` }}
            />
            {floorPlan.base64 && (
              <FontAwesomeIcon
                icon={faBullseye}
                style={[
                  s.positionIcon,
                  {
                    left: currentPosition.x,
                    top: currentPosition.y,
                    transform: [{ scale: Math.min(1.2, 2 / zoomScale) }],
                  },
                ]}
              />
            )}
            {floorPlan.base64 && (
              <FontAwesomeIcon
                icon={faBullseye}
                style={[
                  s.destinationIcon,
                  {
                    left: destinationPixels.x,
                    top: destinationPixels.y,
                    transform: [{ scale: Math.min(1.2, 2 / zoomScale) }],
                  },
                ]}
              />
            )}
            <Svg
              style={{
                position: "absolute",
                width: floorPlan.width,
                height: floorPlan.height,
              }}
            >
              {pathEdges.map((edge) => (
                <Line
                  x1={edge[0].x} // Start x-coordinate
                  y1={edge[0].y} // Start y-coordinate
                  x2={edge[1].x} // End x-coordinate
                  y2={edge[1].y} // End y-coordinate
                  stroke="blue"
                  strokeWidth="2"
                />
              ))}
            </Svg>
          </ImageZoom>
        </View>
        <View style={s.buttons}>
          <TouchableOpacity
            style={[s.btn, isFloorButtonsDisabled && s.disabledBtn]}
            disabled={isFloorButtonsDisabled}
          >
            <AntDesign name="caretup" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, isFloorButtonsDisabled && s.disabledBtn]}
            disabled={isFloorButtonsDisabled}
          >
            <AntDesign name="caretdown" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btn}
            onPress={() =>
              centerOnCoordinate(currentPosition.x, currentPosition.y)
            }
          >
            <FontAwesome6 name="location-arrow" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
