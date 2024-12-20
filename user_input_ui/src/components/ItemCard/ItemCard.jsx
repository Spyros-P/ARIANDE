import React, { useState } from "react";
import {
  cardStyle,
  deleteButtonStyle,
  infoContainerStyle,
  infoStyle,
  titleStyle,
} from "./ItemCard.js";

export const ObjectCard = ({
  number,
  objectType,
  width,
  height,
  startCoords,
  onDeleteCard,
  onSelectDelete,
}) => {
  const [btnIsHovered, setBtnIsHovered] = useState(false);
  return (
    <div
      style={cardStyle}
      onMouseEnter={() => {
        onSelectDelete(startCoords.x, startCoords.y, width, height);
      }}
      onMouseLeave={() => {
        onSelectDelete(null);
      }}
    >
      <h3 style={titleStyle}>
        Object {number}: {objectType}
      </h3>
      <div style={infoContainerStyle}>
        <p style={infoStyle}>
          <strong>Width:</strong> {width}
        </p>
        <p style={infoStyle}>
          <strong>Height:</strong> {height}
        </p>
        <p style={infoStyle}>
          <strong>Start Coordinates:</strong> ({startCoords.x}, {startCoords.y})
        </p>
      </div>
      <button
        className="deleteBtn"
        style={{
          ...deleteButtonStyle,
          backgroundColor: btnIsHovered
            ? "rgb(197, 88, 88)"
            : "rgb(161, 23, 23)",
        }}
        onMouseEnter={() => {
          setBtnIsHovered(true);
          // onSelectDelete(startCoords.x, startCoords.y, width, height);
        }} // Hover starts
        onMouseLeave={() => {
          setBtnIsHovered(false);
          // onSelectDelete(null);
        }} // Hover ends
        onClick={() =>
          onDeleteCard(startCoords.x, startCoords.y, width, height)
        }
      >
        Delete
      </button>
    </div>
  );
};

export default ObjectCard;
