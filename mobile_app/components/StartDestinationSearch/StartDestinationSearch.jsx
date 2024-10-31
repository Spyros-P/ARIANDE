import { View } from "react-native";
import { s } from "./StartDestinationSearch.style.js";
import { SearchBar } from '../SearchBar/SearchBar.jsx'
import FontAwesome from '@expo/vector-icons/FontAwesome';


export function StartDestinationSearch({  }) {
  return (
    <View style = {s.root}>
    <SearchBar placeholder={'Enter the starting location'}/>
    <View style = {s.arrows}>
    <FontAwesome name="arrows-v" size={24} color="black" />
    <FontAwesome name="arrows-v" size={24} color="black" />
    </View>
    <SearchBar placeholder={'Enter the destination'}/>
    </View>
  );
}