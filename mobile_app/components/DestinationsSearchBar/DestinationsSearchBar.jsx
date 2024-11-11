import React, { useState } from "react";
import { TextInput, View, Text, Keyboard, TouchableWithoutFeedback, TouchableOpacity  } from "react-native";
import { s } from "./DestinationsSearchBar.style.js";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons/faMagnifyingGlass";
import { DropDownList } from "../DropDownList/DropDownList.jsx";
import { SelectedDestination } from "../SelectedDestination/SelectedDestination"
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from "@react-navigation/native";

const sampleDestinations = [
  "Room 3A",
  "Restaurant",
  "Room 8A",
  "Parking Lot",
  "Dr Mitsos",
  "Cafe",
  "Dr Thanos",
];

export function DestinationsSearchBar({ fixedItem, isDropdownVisible, setDropdownVisible }) {
  //const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [filteredDestinations, setFilteredDestinations] = useState(sampleDestinations);
  const [isDestinationSelected, setIsDestinationSelected] = useState(false)

  const nav = useNavigation();

  const handleInputFocus = () => {
    setFilteredDestinations(
      (fixedItem ? [fixedItem] : []).concat(
        sampleDestinations
          .sort((a, b) => a.localeCompare(b)) 
      )
    )
    setDropdownVisible(true);
  }

  const handleInputChange = (text) => {
    setInputValue(text);
    setDropdownVisible(true);

    if(!text){
        setFilteredDestinations(
            (fixedItem ? [fixedItem] : []).concat(
            sampleDestinations
              .filter((destination) =>
                destination.toLowerCase().includes(text.toLowerCase())
              )
              .sort((a, b) => a.localeCompare(b)) 
            )
        );
    }
    else{
        setFilteredDestinations(
            sampleDestinations
              .filter((destination) =>
                destination.toLowerCase().includes(text.toLowerCase())
              )
              .sort((a, b) => a.localeCompare(b)) 
        );
    }

  };

  const handleDestinationSelect = (destination) => {
    setInputValue(destination);
    setIsDestinationSelected(true);

    setDropdownVisible(false);

    setTimeout(() => {
      Keyboard.dismiss();
    }, 50);
  };

  const onDeleteText = () => {
    setInputValue('')
    setFilteredDestinations(
      (fixedItem ? [fixedItem] : []).concat(
        sampleDestinations
          .sort((a, b) => a.localeCompare(b)) 
      )
    )
    setDropdownVisible(true);
  }

  const onDeleteDestination = () => {
    setIsDestinationSelected(false)
    setInputValue('')
  }

  return (
    <View style={s.container}>
      {!isDestinationSelected? (
        <View style={s.searchWithList}>
        <View style={s.input}>
          <View style = {s.imgAndText}>
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <TextInput
            placeholder="Where do you want to go?"
            style={s.textInput}
            value={inputValue}
            onFocus={handleInputFocus}
            onChangeText={handleInputChange}
          />
          </View>
          <TouchableOpacity onPress={onDeleteText}>
              <FontAwesome style = {s.deleteText} name="times-circle" size={20} color="red" />     
          </TouchableOpacity> 
        </View>

        {isDropdownVisible && (
          <DropDownList filteredDestinations={filteredDestinations} handleDestinationSelect={handleDestinationSelect} fixedItem = {fixedItem}/>
        )}
      </View>
      ) :(
        <View style={s.searchWithList}><SelectedDestination destination={inputValue} onDeleteDestination={onDeleteDestination}/></View>
      )}

      <TouchableOpacity style={s.navButton} onPress={() => nav.navigate("Library")}>
          <Ionicons name="library" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}
