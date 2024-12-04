import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  main: {
    flex: 1,
  },

  buttons: {
    position: "absolute",
    bottom: 20,
    right: 10,
    height: 160,
    justifyContent: "space-evenly",
    alignItems: "center",
  },

  btn: {
    width: 40,
    height: 40,
    backgroundColor: "black",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  imageOverlayContainer: {
    position: "absolute", // To overlay the image on top of everything
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1, // Ensure it overlays above the content
  },
  searchBar: {
    padding: 20,
  },
  positionIcon: {
    position: "absolute",
    zIndex: 1, // Ensures it's above the image
    color: "blue", // Change color as needed
    fontSize: 30, // Adjust size as needed
  },
  destinationIcon: {
    position: "absolute",
    zIndex: 1, // Ensures it's above the image
    color: "red", // Change color as needed
    fontSize: 30, // Adjust size as needed
  },
  disabledBtn: {
    backgroundColor: "rgb(81, 87, 84)", // Disabled background color
    opacity: 0.3, // Optional: reduce opacity
  },
});
