import React, { useState } from "react";
import { CardList } from "../../components/CardList/CardList.jsx";
import FloorPlanImage from "../../components/FloorPlanImage/FloorPlanImage.jsx";
import { containerStyle } from "./AnnotateFloorPlan.js";
import Papa from "papaparse";
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

  const generateCSV = () => {
    console.log(currentBoundingBoxes);
    const csvData = currentBoundingBoxes
      .concat(detectedBoundingBoxes)
      .map((box) => ({
        filename: currentFileName,
        width: imageDimensions.width,
        height: imageDimensions.height,
        class: "door",
        xmin: box.x,
        ymin: box.y,
        xmax: box.x + box.width,
        ymax: box.y + box.height,
      }));
    // Convert data to CSV using PapaParse
    const csv = Papa.unparse(csvData);

    // Create a Blob from the CSV string
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    // Create a link element
    const link = document.createElement("a");

    // Set the download attribute with the file name
    link.download = "data.csv";

    // Create an object URL for the Blob and set it as the href
    link.href = URL.createObjectURL(blob);

    // Append the link to the document body
    document.body.appendChild(link);

    // Programmatically trigger a click event to download the file
    link.click();

    // Clean up by removing the link element
    document.body.removeChild(link);
  };

  return (
    // <CardList cards={[1, 2, 3]} title={"Model's Bounding Boxes"}></CardList>
    <div style={containerStyle}>
      <FloorPlanImage
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
