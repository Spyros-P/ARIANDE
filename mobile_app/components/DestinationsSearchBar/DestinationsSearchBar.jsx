import React, { useState } from "react";
import { TextInput, View, Text, Keyboard, TouchableWithoutFeedback, ScrollView, TouchableOpacity  } from "react-native";
import { s } from "./DestinationsSearchBar.style.js";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons/faMagnifyingGlass";
import { DropDownList } from "../DropDownList/DropDownList.jsx";

const sampleDestinations = [
  "Room 3A",
  "Restaurant",
  "Room 8A",
  "Parking Lot",
  "Dr Mitsos",
  "Cafe",
  "Dr Thanos",
];

export function DestinationsSearchBar({ fixedItem }) {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [filteredDestinations, setFilteredDestinations] = useState(sampleDestinations);
  const [isDestinationVisible, setIsDestinationVisible] = useState(false)

  const handleInputFocus = () => setDropdownVisible(true);

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
    setIsDestinationVisible(true);

    setDropdownVisible(false);

    setTimeout(() => {
      Keyboard.dismiss();
    }, 50);
  };

  const onDeleteText = () => {
    setInputValue('')
  }

  return (
    <View>
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

      {/* {isDestinationVisible && (
        <Text>{inputValue}</Text>
      )} */}
    </View>
  );
}
