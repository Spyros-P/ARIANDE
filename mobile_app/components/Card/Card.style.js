import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {},
  deleteIcon: {
    color: "rgb(248, 140, 140)",
    transform: "scale(1.25)",
  },
  deleteIconContainer: {
    position: "absolute",
    right: 0,
    bottom: 0,
    padding: 15,
  },
  downloadIcon: {
    color: "rgb(232, 234, 235)",
    transform: "scale(1.25)",
  },
  downloadIconContainer: {
    position: "absolute",
    right: "7%",
    bottom: "10%",
    padding: 5,
    backgroundColor: "#6a9fc290",
    borderRadius: 50,
  },
  tickIcon: {
    color: "rgb(63, 204, 117)",
    transform: "scale(1.25)",
  },
  tickIconContainer: {
    position: "absolute",
    right: "7%",
    bottom: "10%",
    borderRadius: 50,
    backgroundColor: "rgb(10, 117, 89)",
    padding: 5,
  },
  spinnerIcon: {
    color: "rgb(204, 240, 218)",
    transform: "scale(1.25)",
  },
  spinnerIconContainer: {
    position: "absolute",
    right: "7%",
    bottom: "10%",
    borderRadius: 50,
    backgroundColor: "rgb(93, 117, 111)",
    padding: 5,
  },
  mapIcon: {
    transform: "scale(1.1)",
    color: "rgb(175, 245, 233)",
  },
  mapIconContainer: {
    position: "absolute",
    right: "7%",
    top: "10%",
    backgroundColor: "#07615970",
    borderRadius: 50,
    padding: 8,
  },
  buildingImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    backgroundColor: "#6a9fc225",
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
    maxWidth: "67%",
    backgroundColor: "#07615945",
    borderRadius: 10,
    padding: 5,
  },
});
