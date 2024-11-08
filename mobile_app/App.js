import { SQLiteProvider } from "expo-sqlite";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainPage } from "./pages/MainPage/MainPage";
import { Library } from "./pages/Library/Library";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./App.style";
import { useFonts } from "expo-font";
import { initializeDB } from "./db/db_utils";
const Stack = createNativeStackNavigator();

const navTheme = {
  colors: {
    background: "transparent",
  },
};

export default function App() {
  const [isFontLoaded] = useFonts({
    CaviarDreams: require("./assets/fonts/CaviarDreams.ttf"),
    Caviar_Dreams_Bold: require("./assets/fonts/Caviar_Dreams_Bold.ttf"),
    SourGummy_Bold: require("./assets/fonts/SourGummy-Bold.ttf"),
    SourGummy_Regular: require("./assets/fonts/SourGummy-Regular.ttf"),
  });
  return (
    <NavigationContainer theme={navTheme}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <SQLiteProvider databaseName="hipeac.db" onInit={initializeDB}>
            {isFontLoaded && (
              <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName="Library"
              >
                <Stack.Screen name="MainPage" component={MainPage} />
                <Stack.Screen name="Library" component={Library} />
              </Stack.Navigator>
            )}
          </SQLiteProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </NavigationContainer>
  );
}
