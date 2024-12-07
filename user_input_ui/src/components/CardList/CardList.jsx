import React from "react";
import ObjectCard from "../ItemCard/ItemCard.jsx";
import { containerStyle, listTitleStyle } from "./CardList.js";
export const CardList = ({ cards, title, onDeleteCard, onSelectDelete }) => {
  return (
    <div style={containerStyle}>
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
      {cards.length === 0 && <p>No bounding boxes available</p>}
    </div>
  );
};
