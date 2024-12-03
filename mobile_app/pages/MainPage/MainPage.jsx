import React, {  useState } from "react";
import { View, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from "react-native";
import { DestinationsSearchBar } from "../../components/DestinationsSearchBar/DestinationsSearchBar";
import { s } from "./MainPage.style";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Image, Dimensions } from "react-native";
import ImageZoom from "react-native-image-pan-zoom";
import { useSQLiteContext } from "expo-sqlite";
import { fetchFloorPlanByID } from "../../db/db_queries";
export function MainPage({ provideYourScreenName, route }) {
  const db = useSQLiteContext();
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [floorPlan, setFloorPlan] = useState({base64: "", width:0, height:0, graph:[]})
  useFocusEffect(
    React.useCallback(() => {
      const FetchMap = async(id)=>{
        try {
          const res =  await fetchFloorPlanByID(db, id)
          res?.floorPlanBase64 ? setFloorPlan({base64: res.floorPlanBase64, width:res.floorPlanWidth, height:res.floorPlanHeight, graph:res.graph}) :setFloorPlan({base64: "", width:0, height:0, graph:[]})
        } catch (error) {
          console.log(error)
        }
        }
      provideYourScreenName("MainPage");
      if(route.params?.CardId){
        FetchMap(route.params?.CardId)
      }
    }, [route.params?.CardId])
  );
  const doSomething = () => {
    setDropdownVisible(false);
    Keyboard.dismiss();
  };


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
              imageWidth={floorPlan.width} // Set your image width here, or adjust dynamically
              imageHeight={floorPlan.height} // Set your image height here, or adjust dynamically
              panToMove={true} // Enable panning when zoomed in
              pinchToZoom={true} // Enable pinch gestures for zooming
              enableDoubleClickZoom={true} // Allow double-tap zoom toggle
              minScale={1} // Minimum zoom (fits the whole image)
              maxScale={5} // Maximum zoom (5x the original size)
              initialScale={1.5} // Start slightly zoomed in for visual focus
              enableCenterFocus={false} // Keep the image centered when smaller than the viewport
              useNativeDriver={true} // Enable smoother animations with native driver
            >
              <Image
                style={{ width: floorPlan.width, height: floorPlan.height }} // Ensure image takes full screen
                source={{ uri: `${floorPlan.base64}` }}
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
