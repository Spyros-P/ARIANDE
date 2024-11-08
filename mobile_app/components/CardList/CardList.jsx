import { Card } from "../Card/Card";
import { View } from "react-native";
import { styles } from "./CardList.style";

export function CardList({ cards }) {
  return (
    <View style={styles.container}>
      {cards.map((cardInfo, index) => (
        <Card
          key={index}
          image={cardInfo.imageBase64}
          title={cardInfo.name}
          alreadySaved={true}
          style={styles.cardItem}
        />
      ))}
    </View>
  );
}
