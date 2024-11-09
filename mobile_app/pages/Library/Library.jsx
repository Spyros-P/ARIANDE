import { useSQLiteContext } from "expo-sqlite";
import { stringSimilarity } from "string-similarity-js";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons/faArrowLeft";
import { Alert, TouchableOpacity, View } from "react-native";
import { CardList } from "../../components/CardList/CardList";
import { useEffect, useState } from "react";
import { deleteCardById, fetchMyMaps } from "../../db/db_queries";
import { BuildingsSearchBar } from "../../components/BuildingsSearchBar/BuildingsSearchBar";
import { styles } from "./Library.style";
import { Txt } from "../../components/Txt/Txt";
export function Library({ provideYourScreenName }) {
  const db = useSQLiteContext();
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [cardDeleted, setCardDeleted] = useState(false);
  useEffect(() => {
    provideYourScreenName("Library");
    const callFetchMaps = async () => {
      const myMaps = await fetchMyMaps(db);
      setCards(myMaps);
      setFilteredCards(myMaps);
    };
    callFetchMaps();
  }, [cardDeleted]);

  useEffect(() => {
    const filteredMaps = cards.filter(
      (map) =>
        stringSimilarity(map.name, filterText) > 0.5 ||
        map.name.includes(filterText) ||
        map.name
          .split(" ")
          .map((titleItem) =>
            filterText
              .split(" ")
              .map(
                (filterItem) => stringSimilarity(titleItem, filterItem) > 0.5
              )
              .some((item) => item === true)
          )
          .some((item) => item === true)
    );
    setFilteredCards(filteredMaps);
  }, [filterText]);

  const onDeleteCard = (CardId) => {
    deleteCardById(db, CardId);
    setCardDeleted(!cardDeleted);
  };

  const deleteItemShowAlert = (CardId, buildingTitle) =>
    Alert.alert(
      `Delete ${buildingTitle}`,
      `Do you really want to delete this building ?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => onDeleteCard(CardId),
          style: "destructive",
        },
      ],
      {
        cancelable: true,
      }
    );

  const selectCardShowAlert = (CardId, buildingTitle) =>
    Alert.alert(
      `Select ${buildingTitle}`,
      `Do you want to select the map for ${buildingTitle} ?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => console.log(`SELECT ${buildingTitle}`),
          style: "destructive",
        },
      ],
      {
        cancelable: true,
      }
    );

  return (
    <View style={styles.container}>
      <FontAwesomeIcon icon={faArrowLeft} style={styles.backIcon} />
      <BuildingsSearchBar setFilterText={setFilterText} />
      <CardList
        cards={filteredCards}
        alreadySaved={true}
        onDeleteCard={deleteItemShowAlert}
        onSelectCard={selectCardShowAlert}
      />
      <TouchableOpacity style={styles.downloadButton}>
        <Txt style={styles.downloadMoreText}>Download more</Txt>
      </TouchableOpacity>
    </View>
  );
}
