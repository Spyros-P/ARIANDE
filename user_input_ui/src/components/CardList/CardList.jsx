import React from "react";
import ObjectCard from "../ItemCard/ItemCard.jsx";
import { containerStyle, listTitleStyle } from "./CardList.js";
export const CardList = ({
  message,
  cards,
  title,
  onDeleteCard,
  onSelectDelete,
  size,
}) => {
  return (
    <div
      style={{
        ...containerStyle,
        ...{ height: !size || size === "small" ? "fit-content" : "300px" },
      }}
    >
      <p style={listTitleStyle}>{title}</p>
      {cards.map((card, index) => (
        <ObjectCard
          onDeleteCard={onDeleteCard}
          key={index}
          number={index + 1}
          objectType={card.label}
          width={card.width}
          height={card.height}
          startCoords={{ x: card.x, y: card.y }}
          onSelectDelete={onSelectDelete}
        ></ObjectCard>
      ))}
      {cards.length === 0 && !message && <p>No bounding boxes available</p>}
      {cards.length === 0 && message && <p>{message}</p>}
    </div>
  );
};
