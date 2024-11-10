import { useEffect } from "react";
import { View } from "react-native";
import { DestinationsSearchBar } from '../../components/DestinationsSearchBar/DestinationsSearchBar'

export function MainPage({ provideYourScreenName }) {
  useEffect(() => {
    provideYourScreenName("MainPage");
  }, []);
  return <View>
            <DestinationsSearchBar fixedItem={'Emergency Exit'}/>
         </View>;
}
