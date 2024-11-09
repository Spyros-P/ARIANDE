import { Image, Linking, TouchableOpacity, View } from "react-native";
import { Txt } from "../Txt/Txt";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash";
import { faMapLocationDot } from "@fortawesome/free-solid-svg-icons/faMapLocationDot";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons/faArrowDown";
import { styles } from "./Card.style";

export function Card({
  id,
  image,
  title,
  alreadySaved,
  lon,
  lat,
  onDeleteCard,
  onSelectCard,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={() => onSelectCard(id, title)}>
        <Image source={{ uri: `${image}` }} style={styles.buildingImage} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Txt style={styles.title}>{title}</Txt>
      </View>
      <TouchableOpacity
        style={styles.mapIconContainer}
        onPress={() =>
          Linking.openURL(`https://maps.google.com/?q=${lat},${lon}`)
        }
      >
        <FontAwesomeIcon icon={faMapLocationDot} style={styles.mapIcon} />
      </TouchableOpacity>
      {alreadySaved ? (
        <TouchableOpacity
          style={styles.deleteIconContainer}
          onPress={() => onDeleteCard(id, title)}
        >
          <FontAwesomeIcon icon={faTrash} style={styles.deleteIcon} />
        </TouchableOpacity>
      ) : (
        <FontAwesomeIcon icon={faArrowDown} style={styles.downloadIcon} />
      )}
    </View>
  );
}
