import { StyleSheet } from "react-native";

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 8,
    padding: 4,
    backgroundColor: "rgb(218, 252, 242)",
  },

  destination: {
    fontSize: 22,
    fontFamily: "SourGummy_Regular",
  },
  title: {
    fontFamily: "SourGummy_Regular",
  },
});

export { s };
