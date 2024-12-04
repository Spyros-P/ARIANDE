import { SQLiteProvider } from "expo-sqlite";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainPage } from "./pages/MainPage/MainPage";
import { Library } from "./pages/Library/Library";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./App.style";
import { useFonts } from "expo-font";
import { initializeDB } from "./db/db_utils";
import { useState } from "react";
import DummyPage from "./pages/DummyPage/DummyPage";

const Stack = createNativeStackNavigator();

const navTheme = {
  colors: {
    background: "transparent",
  },
};

export default function App() {
  const [currentBackgroundColor, setCurrentBackgroundColor] = useState("white");
  const [isFontLoaded] = useFonts({
    CaviarDreams: require("./assets/fonts/CaviarDreams.ttf"),
    Caviar_Dreams_Bold: require("./assets/fonts/Caviar_Dreams_Bold.ttf"),
    SourGummy_Bold: require("./assets/fonts/SourGummy-Bold.ttf"),
    SourGummy_Regular: require("./assets/fonts/SourGummy-Regular.ttf"),
  });

  const provideYourScreenName = (screenName) => {
    setCurrentBackgroundColor(
      screenName === "MainPage" ? "white" : "rgb(29, 32, 31)"
    );
  };

  return (
    <NavigationContainer theme={navTheme}>
      <SafeAreaProvider>
        <SafeAreaView
          style={[
            styles.container,
            { backgroundColor: currentBackgroundColor },
          ]}
        >
          {/* ImageZoom: Full screen, overlaying on top of content */}

          {/* Navigation and other content */}
          <SQLiteProvider databaseName="hipeac.db" onInit={initializeDB}>
            {isFontLoaded && (
              <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName="Library"
              >
                <Stack.Screen name="MainPage">
                  {({ route }) => (
                    <MainPage
                      provideYourScreenName={provideYourScreenName}
                      route={route}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Library" options={{ unmountOnBlur: true }}>
                  {() => (
                    <Library
                      downloadMorePage={false}
                      provideYourScreenName={provideYourScreenName}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="DownloadMorePage">
                  {() => (
                    <Library
                      downloadMorePage={true}
                      provideYourScreenName={provideYourScreenName}
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Dummy">{() => <DummyPage />}</Stack.Screen>
              </Stack.Navigator>
            )}
          </SQLiteProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </NavigationContainer>
  );
}
