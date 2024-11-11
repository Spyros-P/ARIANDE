import { StyleSheet } from "react-native";

const s = StyleSheet.create({
    container:{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1, 
        borderColor: 'black', 
        borderRadius: 8,
        padding:4
    },

    destination:{
        fontSize: 22
    }
});
  
export { s };