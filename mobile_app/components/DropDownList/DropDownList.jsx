import React from "react";
import { FlatList, Text, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { s } from "./DropDownList.style.js";

export function DropDownList({ filteredDestinations, handleDestinationSelect, fixedItem }) {

    _listEmptyComponent = () => {
        return (
            <Text>
                No destinations found!
            </Text>
        )
    }

  return (
      <FlatList
        keyboardShouldPersistTaps='always'
        data={(filteredDestinations)}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleDestinationSelect(item)}
            style={s.dropdownItem}
          >
            <Text style={[item === fixedItem ? s.specialText : null, s.dropdownText]}>{item}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={_listEmptyComponent}
        style={s.dropdown}
      />
  );
}
