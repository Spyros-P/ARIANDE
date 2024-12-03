import React, { useEffect, useState } from "react";
import { View, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from "react-native";
import { DestinationsSearchBar } from "../../components/DestinationsSearchBar/DestinationsSearchBar";
import { s } from "./MainPage.style";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Image, Dimensions } from "react-native";
import ImageZoom from "react-native-image-pan-zoom";
import backgroundImage from "../../assets/floorPlan2.png";
export function MainPage({ provideYourScreenName }) {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [imageSize, setImageSize] = useState({width:0, height:0})
  useFocusEffect(
    React.useCallback(() => {
      provideYourScreenName("MainPage");
    }, [])
  );
  const doSomething = () => {
    setDropdownVisible(false);
    Keyboard.dismiss();
  };

  useEffect(()=>{
    const { width, height } = Image.resolveAssetSource(backgroundImage);
    setImageSize({ width, height });
  },[])

  return (
    <TouchableWithoutFeedback onPress={doSomething}>
      <View style={s.main}>
        <View style={s.searchBar}>
        <DestinationsSearchBar
          fixedItem={"Emergency Exit"}
          isDropdownVisible={isDropdownVisible}
          setDropdownVisible={setDropdownVisible}
        />
        </View>
          <View style={s.imageOverlayContainer}>
            <ImageZoom
              cropWidth={Dimensions.get("window").width}
              cropHeight={Dimensions.get("window").height}
              imageWidth={imageSize.width} // Set your image width here, or adjust dynamically
              imageHeight={imageSize.height} // Set your image height here, or adjust dynamically
            >
              <Image
                style={{ width: imageSize.width, height: imageSize.height }} // Ensure image takes full screen
                source={backgroundImage}
              />
            </ImageZoom>
          </View>
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
