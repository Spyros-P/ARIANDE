import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    minWidth: "100%",

    backgroundColor: "rgb(42, 51, 49)",

    borderRadius: 20,
  },
  cardItem: { height: 120, width: "45%" },
  message: {
    fontFamily: "SourGummy_Regular",
    fontSize: 25,
    color: "#ecfafa",
    padding: 10,
  },
});
