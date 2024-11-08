import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {},
  deleteIcon: {
    color: "rgb(248, 140, 140)",
    position: "absolute",
    right: "7%",
    bottom: "10%",
    transform: "scale(1.25)",
  },
  downloadIcon: {
    color: "rgb(232, 234, 235)",
    position: "absolute",
    right: "7%",
    bottom: "10%",
    transform: "scale(1.25)",
  },
  buildingImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  title: {
    fontFamily: "SourGummy_Regular",
    fontSize: 17,
    color: "#ecfafa",
  },
  titleContainer: {
    position: "absolute",
    bottom: "10%",
    left: 10,
    maxWidth: "75%",
    backgroundColor: "#07615945",
    borderRadius: 10,
    padding: 5,
  },
});
