import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  textInput: {
    backgroundColor: "white",
    height: 40,
    paddingHorizontal: 35,
    borderRadius: 20,
    fontFamily: "SourGummy_Regular",
  },
  searchbarContainer: {
    width: "75%",
    flexDirection: "column",
    justifyContent: "center",
  },
  glassIcon: {
    position: "absolute",
    zIndex: 1,
    left: 10,
  },
});
