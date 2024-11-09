import { useEffect } from "react";
import { View } from "react-native";
export function MainPage({ provideYourScreenName }) {
  useEffect(() => {
    provideYourScreenName("MainPage");
  }, []);
  return <View></View>;
}
