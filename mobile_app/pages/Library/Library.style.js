import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 30,
  },
  backIcon: {
    alignSelf: "flex-start",
    transform: "scale(2)",
    position: "relative",
    top: 10,
    left: 10,
    color: "rgb(195, 226, 221)",
  },
  downloadButton: {
    width: "100%",
    borderRadius: 30,
    padding: 15,
    marginHorizontal: 30,
    backgroundColor: "rgb(97, 122, 118)",
    alignItems: "center",
  },
  downloadMoreText: {
    fontFamily: "SourGummy_Regular",
    fontSize: 20,
    color: "#ecfafa",
  },
});
