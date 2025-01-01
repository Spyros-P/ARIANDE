import React, { useState } from "react";
import { CardList } from "../../components/CardList/CardList.jsx";
import FloorPlanImage from "../../components/FloorPlanImage/FloorPlanImage.jsx";
import {
  cardContainer,
  columnStyleMain,
  columnStyleSecondary,
  containerStyle,
  pageContainer,
  seeDetails,
} from "./AnnotateFloorPlan.js";
import { generateAndDownloadCSV } from "../../utils/downloadCSV.js";
import { generateAndDownloadXML } from "../../utils/downloadXML.js";
import Header from "../../components/Header/Header.jsx";
const AnnotateFloorPlan = () => {
  const [currentBoundingBoxes, setCurrentBoundingBoxes] = useState([]);
  const [detectedBoundingBoxes, setDetectedBoundingBoxes] = useState([
    { x: 100, y: 100, width: 60, height: 70, label: "door" },
  ]);
  const [highlightedBox, setHighlightedBox] = useState(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
    depth: 3,
  });

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

  const generateCSV = () =>
    generateAndDownloadCSV(
      currentBoundingBoxes,
      detectedBoundingBoxes,
      currentFileName,
      imageDimensions
    );

  const generateXML = () =>
    generateAndDownloadXML(
      currentBoundingBoxes,
      detectedBoundingBoxes,
      imageDimensions,
      currentFileName
    );
  return (
    // <CardList cards={[1, 2, 3]} title={"Model's Bounding Boxes"}></CardList>
    <div style={pageContainer}>
      <div style={containerStyle}>
        <div style={columnStyleMain}>
          <FloorPlanImage
            generateXML={generateXML}
            generateCSV={generateCSV}
            setImageDimensions={setImageDimensions}
            setCurrentFileName={setCurrentFileName}
            highlightedBox={highlightedBox}
            currentBoundingBoxes={currentBoundingBoxes}
            setCurrentBoundingBoxes={setCurrentBoundingBoxes}
            setDetectedBoundingBoxes={setDetectedBoundingBoxes}
            detectedBoundingBoxes={detectedBoundingBoxes}
            imageSrc={
              "https://wpmedia.roomsketcher.com/content/uploads/2022/01/06145940/What-is-a-floor-plan-with-dimensions.png"
            } // Replace with your image URL
          />
        </div>
        <div style={columnStyleSecondary}>
          <div style={cardContainer}>
            {currentFileName && (
              <>
                <CardList
                  onDeleteCard={(x, y, w, h) => onDeleteCard(x, y, w, h, 1)}
                  setCurrentBoundingBoxes={setCurrentBoundingBoxes}
                  setDetectedBoundingBoxes={setDetectedBoundingBoxes}
                  cards={detectedBoundingBoxes}
                  title={"Model's Bounding Boxes"}
                  onSelectDelete={onSelectDelete}
                ></CardList>{" "}
                <CardList
                  onDeleteCard={(x, y, w, h) => onDeleteCard(x, y, w, h, 2)}
                  cards={currentBoundingBoxes}
                  title={"My Bounding Boxes"}
                  onSelectDelete={onSelectDelete}
                ></CardList>
              </>
            )}
            {!currentFileName && (
              <CardList
                onDeleteCard={(x, y, w, h) => {}}
                cards={[]}
                title={"Upload your Floor Plan"}
                message={
                  "The floor plan will then be analyzed by advanced ML models"
                }
                onSelectDelete={() => {}}
              ></CardList>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnotateFloorPlan;
