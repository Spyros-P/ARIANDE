import { useSQLiteContext } from "expo-sqlite";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons/faArrowLeft";
import { View } from "react-native";
import { CardList } from "../../components/CardList/CardList";
import { useEffect, useState } from "react";
import { fetchMyMaps } from "../../db/db_queries";
export function Library() {
  const db = useSQLiteContext();
  const [cards, setCards] = useState([]);
  useEffect(() => {
    const callFetchMaps = async () => {
      const myMaps = await fetchMyMaps(db);
      setCards(myMaps);
    };
    callFetchMaps();
  }, []);
  return (
    <View>
      <FontAwesomeIcon icon={faArrowLeft} />
      <CardList cards={cards} />
    </View>
  );
}
