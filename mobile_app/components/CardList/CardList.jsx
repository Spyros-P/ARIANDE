import { Card } from "../Card/Card";
import { ScrollView, View } from "react-native";
import { styles } from "./CardList.style";

export function CardList({ cards, alreadySaved, onDeleteCard, onSelectCard }) {
  return (
    <ScrollView>
      <View style={styles.container}>
        {cards.map((cardInfo, index) => (
          <Card
            key={index}
            id={cardInfo.id}
            image={cardInfo.imageBase64}
            title={cardInfo.name}
            alreadySaved={alreadySaved}
            lat={cardInfo.lat}
            lon={cardInfo.lon}
            onDeleteCard={onDeleteCard}
            onSelectCard={onSelectCard}
            style={styles.cardItem}
          />
        ))}
      </View>
    </ScrollView>
  );
}
