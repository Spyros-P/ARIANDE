import { TextInput } from "react-native";
import { s } from "./SearchBar.style.js";

export function SearchBar({ placeholder }) {
  return (
    <TextInput
      style={s.input}
      placeholder={placeholder}
    />
  );
}