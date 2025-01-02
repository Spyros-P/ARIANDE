import React, { useContext, useState } from "react";
import { CardList } from "../../components/CardList/CardList.jsx";
import FloorPlanImage from "../../components/FloorPlanImage/FloorPlanImage.jsx";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  cardContainer,
  columnStyleMain,
  columnStyleSecondary,
  containerStyle,
  pageContainer,
  seeDetails,
  showDetailsButton,
} from "./AnnotateFloorPlan.js";
import { generateAndDownloadCSV } from "../../utils/downloadCSV.js";
import { generateAndDownloadXML } from "../../utils/downloadXML.js";
import Header from "../../components/Header/Header.jsx";
import { WindowSizeContext } from "../../context/WindowSize/WindowSize.jsx";
const AnnotateFloorPlan = () => {
  const [currentBoundingBoxes, setCurrentBoundingBoxes] = useState([]);
  const [detectedBoundingBoxes, setDetectedBoundingBoxes] = useState([]);
  const [highlightedBox, setHighlightedBox] = useState(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
    depth: 3,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [isLoadingInference, setIsLoadingInference] = useState(false);

  const { width, height } = useContext(WindowSizeContext);

  const onDeleteCard = (x, y, w, h, i) => {
    if (i === 1 || i === 3)
      setDetectedBoundingBoxes(
        detectedBoundingBoxes.filter(
          (box) =>
            box.x !== x && box.y !== y && box.width !== w && box.height !== h
        )
      );
    if (i === 2 || i === 3)
      setCurrentBoundingBoxes(
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
            setIsLoadingInference={setIsLoadingInference}
            isLoadingInference={isLoadingInference}
            onDeleteDoor={onDeleteCard}
            imageDimensions={imageDimensions}
            generateXML={generateXML}
            generateCSV={generateCSV}
            setImageDimensions={setImageDimensions}
            setCurrentFileName={setCurrentFileName}
            highlightedBox={highlightedBox}
            setHighlightedBox={setHighlightedBox}
            currentBoundingBoxes={currentBoundingBoxes}
            setCurrentBoundingBoxes={setCurrentBoundingBoxes}
            setDetectedBoundingBoxes={setDetectedBoundingBoxes}
            detectedBoundingBoxes={detectedBoundingBoxes}
            imageSrc={
              "https://wpmedia.roomsketcher.com/content/uploads/2022/01/06145940/What-is-a-floor-plan-with-dimensions.png"
            } // Replace with your image URL
          />
        </div>
        {width > 1100 && (
          <div
            style={{
              ...columnStyleSecondary,
              ...{ flex: showDetails ? 5 : 1 },
            }}
          >
            {currentFileName && (
              <button
                onClick={() => {
                  setShowDetails(!showDetails);
                }}
                className="details-button"
                style={showDetailsButton}
              >
                <FontAwesomeIcon
                  icon={showDetails ? faArrowRight : faArrowLeft}
                  size="2x"
                />
              </button>
            )}

            <div style={cardContainer}>
              {currentFileName && showDetails && !isLoadingInference && (
                <>
                  {" "}
                  <CardList
                    size="medium"
                    onDeleteCard={(x, y, w, h) => onDeleteCard(x, y, w, h, 1)}
                    setCurrentBoundingBoxes={setCurrentBoundingBoxes}
                    setDetectedBoundingBoxes={setDetectedBoundingBoxes}
                    cards={detectedBoundingBoxes}
                    title={"Model's Bounding Boxes"}
                    onSelectDelete={onSelectDelete}
                  ></CardList>
                  <CardList
                    size="medium"
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
        )}{" "}
      </div>
    </div>
  );
};

export default AnnotateFloorPlan;
