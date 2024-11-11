import { useSQLiteContext } from "expo-sqlite";
import { stringSimilarity } from "string-similarity-js";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons/faArrowLeft";
import { Alert, TouchableOpacity, View } from "react-native";
import { CardList } from "../../components/CardList/CardList";
import React, { useEffect, useState } from "react";
import {
  deleteCardById,
  downloadNewBuilding,
  fetchMyMaps,
} from "../../db/db_queries";
import { BuildingsSearchBar } from "../../components/BuildingsSearchBar/BuildingsSearchBar";
import { styles } from "./Library.style";
import { Txt } from "../../components/Txt/Txt";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { fetchDownloadableBuildings } from "../../api/strapi-calls";
export function Library({ downloadMorePage, provideYourScreenName }) {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [cardDeleted, setCardDeleted] = useState(false);
  const [focusAgain, setfocusAgain] = useState(false);
  const [errorToFetchData, setErrorToFetchData] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setfocusAgain((prevState) => !prevState);
    }, [])
  );

  useEffect(() => {
    provideYourScreenName("Library");
    const callFetchMyMaps = async () => {
      try {
        const myMaps = await fetchMyMaps(db);
        setCards(myMaps);
        setFilteredCards(myMaps);
        setErrorToFetchData("");
      } catch (error) {
        setErrorToFetchData(
          "Error when trying to load your buildings. Try again!"
        );
      }
    };
    const fetchBuildingsToDownload = async () => {
      try {
        setIsLoading(true);
        const myMaps = await fetchMyMaps(db);
        var buildingsToDownload = await fetchDownloadableBuildings();
        buildingsToDownload = buildingsToDownload.map((candidateBuilding) => {
          if (
            myMaps.some(
              (savedBuilding) => savedBuilding.id === candidateBuilding.id
            )
          ) {
            return { ...candidateBuilding, alreadySaved: true };
          } else {
            return { ...candidateBuilding };
          }
        });
        setCards(buildingsToDownload);
        setFilteredCards(buildingsToDownload);
        setErrorToFetchData("");
        setIsLoading(false);
      } catch (error) {
        setErrorToFetchData(
          "Error when trying to load the available buildings. Try again!"
        );
        console.log("ERROR", error);
        setIsLoading(false);
      }
    };
    !downloadMorePage ? callFetchMyMaps() : fetchBuildingsToDownload();
  }, [cardDeleted, focusAgain]);

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

  const storeNewBuilding = async (id, name, image, lat, lon) => {
    const downloadingCardIndex = filteredCards.findIndex(
      (card) => card.id === id
    );
    var newDownloadingCard = {
      ...filteredCards.find((card) => card.id === id),
      downloading: true,
      downloaded: false,
    };
    filteredCards[downloadingCardIndex] = newDownloadingCard;
    setFilteredCards([...filteredCards]);
    await downloadNewBuilding(db, id, name, image, lat, lon);
    setTimeout(() => {
      newDownloadingCard = {
        ...newDownloadingCard,
        downloaded: true,
        downloading: false,
      };
      filteredCards[downloadingCardIndex] = newDownloadingCard;
      setFilteredCards([...filteredCards]);
    }, 750);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backIconContainer}
        onPress={navigation.goBack}
      >
        <FontAwesomeIcon icon={faArrowLeft} style={styles.backIcon} />
      </TouchableOpacity>
      <BuildingsSearchBar setFilterText={setFilterText} />
      {isLoading && <Txt style={styles.text}>Loading...</Txt>}
      {!errorToFetchData ? (
        <CardList
          downloadMorePage={downloadMorePage}
          cards={filteredCards}
          onDeleteCard={deleteItemShowAlert}
          onSelectCard={selectCardShowAlert}
          storeNewBuilding={storeNewBuilding}
        />
      ) : (
        <Txt style={styles.text}>{errorToFetchData}</Txt>
      )}
      {!downloadMorePage && (
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => navigation.navigate("DownloadMorePage")}
        >
          <Txt style={styles.text}>Download more</Txt>
        </TouchableOpacity>
      )}
    </View>
  );
}
