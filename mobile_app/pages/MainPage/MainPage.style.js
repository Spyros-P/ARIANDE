import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
    main:{
        flex:1
    },

    buttons:{
        position: 'absolute',
        bottom: 20,
        right: 10,
        height: 160,
        justifyContent:'space-evenly',
        alignItems: 'center'
    },

    btn:{
        width: 40,
        height: 40,
        backgroundColor: 'black',
        borderWidth: 1,
        borderColor: "black",
        borderRadius: 5,
        alignItems:'center',
        justifyContent:'center'
    }
});