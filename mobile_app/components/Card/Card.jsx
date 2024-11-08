import { Image, View } from "react-native";
import { Txt } from "../Txt/Txt";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons/faArrowDown";
import { styles } from "./Card.style";

export function Card({ image, title, alreadySaved, style }) {
  return (
    <View style={[styles.container, style]}>
      <Image source={{ uri: `${image}` }} style={styles.buildingImage} />
      <View style={styles.titleContainer}>
        <Txt style={styles.title}>{title}</Txt>
      </View>
      {alreadySaved ? (
        <FontAwesomeIcon icon={faTrash} style={styles.deleteIcon} />
      ) : (
        <FontAwesomeIcon icon={faArrowDown} style={styles.downloadIcon} />
      )}
    </View>
  );
}
