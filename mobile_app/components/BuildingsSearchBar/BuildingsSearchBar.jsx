import { TextInput, View } from "react-native";
import { styles } from "./BuildingsSearchBar.style";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons/faMagnifyingGlass";

export function BuildingsSearchBar({ setFilterText }) {
  return (
    <View style={styles.searchbarContainer}>
      <FontAwesomeIcon icon={faMagnifyingGlass} style={styles.glassIcon} />
      <TextInput
        onChangeText={setFilterText}
        placeholder="Search for buildings"
        style={styles.textInput}
      />
    </View>
  );
}
