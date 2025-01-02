import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 30,
    padding: 20,
  },
  backIcon: {
    transform: "scale(1.5)",
    color: "rgb(195, 226, 221)",
    marginLeft: 5,
  },
  backIconContainer: {
    alignSelf: "flex-start",
    position: "relative",
    top: 10,
    left: 10,
  },
  downloadButton: {
    width: "100%",
    borderRadius: 30,
    padding: 15,
    marginHorizontal: 30,
    backgroundColor: "rgb(97, 122, 118)",
    alignItems: "center",
  },
  text: {
    fontFamily: "SourGummy_Regular",
    fontSize: 20,
    color: "#ecfafa",
  },
  textTitle: {
    marginTop: 20,
    fontFamily: "SourGummy_Regular",
    fontSize: 25,
    color: "#687a78",
  },
});
