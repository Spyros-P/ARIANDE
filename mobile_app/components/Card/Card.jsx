import { Image, Linking, TouchableOpacity, View } from "react-native";
import { Txt } from "../Txt/Txt";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons/faTrash";
import { faMapLocationDot } from "@fortawesome/free-solid-svg-icons/faMapLocationDot";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons/faArrowDown";
import { faSpinner } from "@fortawesome/free-solid-svg-icons/faSpinner";
import { faCheck } from "@fortawesome/free-solid-svg-icons/faCheck";

import { styles } from "./Card.style";

export function Card({
  id,
  image,
  floorPlan,
  floorPlanWidth,
  floorPlanHeight,
  graph,
  title,
  alreadySaved,
  lon,
  lat,
  onDeleteCard,
  onSelectCard,
  style,
  storeNewBuilding,
  downloading,
  downloadMorePage,
  downloaded,
}) {
  const onTapCard = alreadySaved ? () => onSelectCard(id, title) : () => {};
  const onDownloadBuilding = () => {
    console.log("DOWNLOAD");
    storeNewBuilding(id, title, image, floorPlan,floorPlanWidth,floorPlanHeight,graph,lat, lon);
  };
  console.log(title, downloading, downloaded);
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={onTapCard}>
        <Image source={{ uri: `${image}` }} style={styles.buildingImage} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.titleContainer} onPress={onTapCard}>
        <Txt style={styles.title}>{title}</Txt>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.mapIconContainer}
        onPress={() =>
          Linking.openURL(`https://maps.google.com/?q=${lat},${lon}`)
        }
      >
        <FontAwesomeIcon icon={faMapLocationDot} style={styles.mapIcon} />
      </TouchableOpacity>
      {alreadySaved && !downloadMorePage && (
        <TouchableOpacity
          style={styles.deleteIconContainer}
          onPress={() => onDeleteCard(id, title)}
        >
          <FontAwesomeIcon icon={faTrash} style={styles.deleteIcon} />
        </TouchableOpacity>
      )}
      {alreadySaved && downloadMorePage && (
        <TouchableOpacity style={styles.tickIconContainer}>
          <FontAwesomeIcon icon={faCheck} style={styles.tickIcon} />
        </TouchableOpacity>
      )}
      {downloading && !downloaded && (
        <TouchableOpacity style={styles.spinnerIconContainer}>
          <FontAwesomeIcon icon={faSpinner} style={styles.spinnerIcon} />
        </TouchableOpacity>
      )}
      {!downloading && downloaded && (
        <TouchableOpacity style={styles.tickIconContainer}>
          <FontAwesomeIcon icon={faCheck} style={styles.tickIcon} />
        </TouchableOpacity>
      )}
      {!alreadySaved && !downloading && !downloaded && (
        <TouchableOpacity
          style={styles.downloadIconContainer}
          onPress={onDownloadBuilding}
        >
          <FontAwesomeIcon icon={faArrowDown} style={styles.downloadIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
}
