import React, { useState } from "react";
import { View, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from "react-native";
import { DestinationsSearchBar } from "../../components/DestinationsSearchBar/DestinationsSearchBar";
import { s } from "./MainPage.style";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AntDesign from '@expo/vector-icons/AntDesign';

export function MainPage({ provideYourScreenName }) {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  useFocusEffect(
    React.useCallback(() => {
      provideYourScreenName("MainPage");
    }, [])
  );
  const doSomething = () => {
    setDropdownVisible(false);
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={doSomething}>
      <View style={s.main}>
        <DestinationsSearchBar
          fixedItem={"Emergency Exit"}
          isDropdownVisible={isDropdownVisible}
          setDropdownVisible={setDropdownVisible}
        />
        <View style={s.buttons}>
          <TouchableOpacity style={s.btn}>
            <AntDesign name="caretup" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={s.btn}>
            <AntDesign name="caretdown" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={s.btn}>
            <FontAwesome6 name="location-arrow" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
