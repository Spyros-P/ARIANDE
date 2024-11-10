import { Card } from "../Card/Card";
import { ScrollView, View } from "react-native";
import { styles } from "./CardList.style";
import { Txt } from "../Txt/Txt";

export function CardList({
  downloadMorePage,
  cards,
  onDeleteCard,
  onSelectCard,
  storeNewBuilding,
}) {
  return (
    <ScrollView>
      <View style={[styles.container, { padding: cards.length > 0 ? 15 : 0 }]}>
        {cards.map((cardInfo, index) => (
          <Card
            downloadMorePage={downloadMorePage}
            key={index}
            id={cardInfo.id}
            image={cardInfo.imageBase64}
            title={cardInfo.name}
            alreadySaved={cardInfo.alreadySaved}
            lat={cardInfo.lat}
            lon={cardInfo.lon}
            onDeleteCard={onDeleteCard}
            onSelectCard={onSelectCard}
            style={styles.cardItem}
            storeNewBuilding={storeNewBuilding}
            downloading={cardInfo.downloading}
            downloaded={cardInfo?.downloaded}
          />
        ))}
        {cards.length === 0 && !downloadMorePage && (
          <Txt style={styles.message}>Download some new buildings!</Txt>
        )}
      </View>
    </ScrollView>
  );
}
