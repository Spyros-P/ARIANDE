import { Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { s } from "./App.style";

import { StartDestinationSearch } from "./components/StartDestinationSearch/StartDestinationSearch.jsx"
import { Map } from "./components/Map/Map.jsx"
import { useEffect, useState } from "react";

const graph = {
  nodes: [
    { id: 'Room1', x: 50, y: 50 },
    { id: 'Room2', x: 280, y: 50 },
    { id: 'Room3', x: 280, y: 280 },
    { id: 'Room4', x: 50, y: 280 },
  ],
  edges: [
    { from: 'Room1', to: 'Room2' },
    { from: 'Room2', to: 'Room3' },
    { from: 'Room3', to: 'Room4' },
    { from: 'Room4', to: 'Room1' },
  ],
};


export default function App() {
  const [userPositionX, setUserPositionX] = useState(50)
  const [userPositionY, setUserPositionY] = useState(50)

  const [direction, setDirection] = useState('down');

  function updateUserPosition() {
    if (direction === 'down') {
      setUserPositionY(prev => {
        if (prev >= 280) {
          setDirection('right');
          return 280; 
        }
        return prev + 40;
      });
    } else if (direction === 'right') {
      setUserPositionX(prev => {
        if (prev >= 280) {
          setDirection('up'); 
          return 280; 
        }
        return prev + 40;
      });
      setUserPositionY(280); 
    } else if (direction === 'up') {
      setUserPositionY(prev => {
        if (prev <= 50) {
          setDirection('left');
          return 50;
        }
        return prev - 40; 
      });
      setUserPositionX(280); 
    } else if (direction === 'left') {
      setUserPositionX(prev => {
        if (prev <= 50) {
          setDirection('down');
          return 50;
        }
        return prev - 40;
      });
      setUserPositionY(50);
    }
  }

  useEffect(() => {
    const intervalId = setInterval(updateUserPosition, 2000);
    return () => clearInterval(intervalId);
  }, [direction]);


  return (
      <SafeAreaProvider>
        <SafeAreaView style={s.app}>
          <View style={s.header}>
            <StartDestinationSearch/>
          </View>
          <View style={s.body}>
            <Map graph={graph} userPositionX={userPositionX} userPositionY={userPositionY}/>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
  );
}