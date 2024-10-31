import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Text } from 'react-native-svg';
import { LocationIcon } from '../LocationIcon/LocationIcon.jsx'

import { s } from './Map.style.js'; 

export function Map({ graph, userPositionX, userPositionY }) {
  const roomWidth = 50; // Width of the room (TBA)
  const roomHeight = 50; // Height of the room (TBA)

  return (
    <View style={s.mapContainer}>
      <Svg>
        {graph.edges.map((edge, index) => {
          const fromNode = graph.nodes.find(node => node.id === edge.from);
          const toNode = graph.nodes.find(node => node.id === edge.to);

          const fromCenterX = fromNode.x + roomWidth / 2; 
          const fromCenterY = fromNode.y + roomHeight / 2;
          const toCenterX = toNode.x + roomWidth / 2; 
          const toCenterY = toNode.y + roomHeight / 2;

          return (
            <Line
              key={index}
              x1={fromCenterX}
              y1={fromCenterY}
              x2={toCenterX}
              y2={toCenterY}
              stroke="gray"
              strokeWidth="4"
              strokeDasharray="5, 5" 
            />
          );
        })}

        {graph.nodes.map((node, index) => (
          <React.Fragment key={index}>
            <Rect
              x={node.x} 
              y={node.y}
              width={roomWidth}
              height={roomHeight}
              fill="lightblue" 
              stroke="blue"
              strokeWidth="2"
            />
            <Text
              x={node.x}
              y={node.y}
              fontSize="14"
              fill="black"
              textAnchor="middle"
            >
              {node.id} 
            </Text>
          </React.Fragment>
        ))}
      </Svg>

      <View style={{
        position: 'absolute',
        left: userPositionX, 
        top: userPositionY,
      }}>
        <LocationIcon size={40} color={'blue'}/>
      </View>
    </View>
  );
}
