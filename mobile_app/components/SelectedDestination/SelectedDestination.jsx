import { Text, View, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { s } from "./SelectedDestination.style.js";

export function SelectedDestination({ destination, onDeleteDestination }) {
    return <View style = {s.container}>
                <View style = {s.text}>
                    <Text style = {s.title}>Destination</Text>
                    <Text style = {s.destination}>{destination}</Text>
                </View>
                
                <View style = {s.deleteDestination}>
                    <TouchableOpacity onPress={onDeleteDestination}>
                        <FontAwesome name="times-circle" size={20} color="red" />     
                    </TouchableOpacity> 
                </View>
           </View>
}