import React, { useState } from "react";
import { View, TouchableWithoutFeedback, Keyboard } from "react-native";
import { DestinationsSearchBar } from "../../components/DestinationsSearchBar/DestinationsSearchBar";
import { s } from "./MainPage.style";
import { useFocusEffect } from "@react-navigation/native";

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
      </View>
    </TouchableWithoutFeedback>
  );
}
