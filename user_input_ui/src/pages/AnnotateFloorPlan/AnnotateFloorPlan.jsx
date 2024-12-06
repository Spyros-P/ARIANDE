import React, { useState } from "react";
import { CardList } from "../../components/CardList/CardList.jsx";
import FloorPlanImage from "../../components/FloorPlanImage/FloorPlanImage.jsx";
import { containerStyle } from "./AnnotateFloorPlan.js";

const AnnotateFloorPlan = () => {
  const [currentBoundingBoxes, setCurrentBoundingBoxes] = useState([]);
  const [detectedBoundingBoxes, setDetectedBoundingBoxes] = useState([
    { x: 100, y: 100, width: 60, height: 70, label: "uknown" },
  ]);
  const [highlightedBox, setHighlightedBox] = useState(null);

  const onDeleteCard = (x, y, w, h, i) => {
    i === 1
      ? setDetectedBoundingBoxes(
          detectedBoundingBoxes.filter(
            (box) =>
              box.x !== x && box.y !== y && box.width !== w && box.height !== h
          )
        )
      : setCurrentBoundingBoxes(
          currentBoundingBoxes.filter(
            (box) =>
              box.x !== x && box.y !== y && box.width !== w && box.height !== h
          )
        );
  };

  const onSelectDelete = (x, y, w, h) => {
    setHighlightedBox({ x: x, y: y, width: w, height: h });
  };

  return (
    // <CardList cards={[1, 2, 3]} title={"Model's Bounding Boxes"}></CardList>
    <div style={containerStyle}>
      <FloorPlanImage
        highlightedBox={highlightedBox}
        currentBoundingBoxes={currentBoundingBoxes}
        setCurrentBoundingBoxes={setCurrentBoundingBoxes}
        setDetectedBoundingBoxes={setDetectedBoundingBoxes}
        detectedBoundingBoxes={detectedBoundingBoxes}
        imageSrc={
          "https://wpmedia.roomsketcher.com/content/uploads/2022/01/06145940/What-is-a-floor-plan-with-dimensions.png"
        } // Replace with your image URL
      />
      <CardList
        onDeleteCard={(x, y, w, h) => onDeleteCard(x, y, w, h, 1)}
        setCurrentBoundingBoxes={setCurrentBoundingBoxes}
        setDetectedBoundingBoxes={setDetectedBoundingBoxes}
        cards={detectedBoundingBoxes}
        title={"Model's Bounding Boxes"}
        onSelectDelete={onSelectDelete}
      ></CardList>
      <CardList
        onDeleteCard={(x, y, w, h) => onDeleteCard(x, y, w, h, 2)}
        cards={currentBoundingBoxes}
        title={"My Bounding Boxes"}
        onSelectDelete={onSelectDelete}
      ></CardList>
    </div>
  );
};

export default AnnotateFloorPlan;
