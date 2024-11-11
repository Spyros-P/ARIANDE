import { StyleSheet } from "react-native";

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  navButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 20,
    marginLeft: 10,
    backgroundColor: "blue",
  },

  searchWithList: {
    flex: 1,
    paddingRight: 8,
  },

  input: {
    backgroundColor: "white",
    height: 40,
    paddingLeft: 20,
    borderRadius: 20,
    fontFamily: "SourGummy_Regular",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
  },

  imgAndText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexGrow: 1,
    alignSelf: "stretch",
  },

  deleteText: {
    paddingRight: 10,
  },
  textInput: {
    fontFamily: "SourGummy_Regular",
    flex: 1,
  },
});

export { s };
