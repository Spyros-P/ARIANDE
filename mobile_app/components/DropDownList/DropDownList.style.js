import { StyleSheet } from "react-native";

const s = StyleSheet.create({
  dropdown: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    maxHeight: 200,
    position: "absolute",
    width: "100%",
    top: 40,
    zIndex: 10,
    padding: 5,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },

  dropdownText: {
    fontFamily: "SourGummy_Regular",
  },
  specialText: {
    color: "#920000",
  },
});

export { s };
