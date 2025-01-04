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
  nameInput,
  pageContainer,
  seeDetails,
  showDetailsButton,
  submitButton,
} from "./AnnotateFloorPlan.js";
import { generateAndDownloadCSV } from "../../utils/downloadCSV.js";
import { generateAndDownloadXML } from "../../utils/downloadXML.js";
import Header from "../../components/Header/Header.jsx";
import { WindowSizeContext } from "../../context/WindowSize/WindowSize.jsx";
import FileInputComponent from "../../components/FileInput/FileInput.jsx";
import ImageDisplay from "../../components/ShowImage/ShowImage.jsx";

const validFileTypes = ["png", "jpeg", "jpg"];
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
  const [showOtherFields, setShowOtherFields] = useState(false);

  const [isLoadingInference, setIsLoadingInference] = useState(false);
  const [fileType, setFileType] = useState(null);
  const [fileTypeError, setFileTypeError] = useState("");
  const [buildingImgSrc, setBuildingImgSrc] = useState(null);
  const [buildingName, setBuildingName] = useState("");
  const [buildingNameError, setBuildingNameError] = useState("");

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
  function downloadImage(imageSrc, fileName = "buildingImageAriadne") {
    const link = document.createElement("a"); // Create a temporary anchor element
    link.href = imageSrc; // Set the image source as the link's href
    link.download = fileName; // Set the default download file name
    link.click(); // Programmatically trigger a click on the link to download the file
  }

  const handleBuildingImage = (e) => {
    const file = e.target.files[0]; // Get the selected file
    if (file) {
      setFileType(file.type.split("/")[1]);
      if (validFileTypes.includes(file.type.split("/")[1])) {
        setFileTypeError("");
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageSrc = reader.result;
          setBuildingImgSrc(imageSrc); // Set image source to the result of FileReader

          // Create an Image object to load the image and retrieve dimensions
          const image = new Image();
          image.onload = () => {
            console.log("Image Width:", image.width);
            console.log("Image Height:", image.height);
          };
          console.log(imageSrc);
          image.src = imageSrc; // Trigger the image load
        };
        reader.readAsDataURL(file); // Read the file as a data URL
      } else {
        setFileTypeError(`${file.type.split("/")[1]} is not accepted`);
      }
    }
  };
  const handleBuildingName = (e) => {
    console.log(e.target.value);
    setBuildingName(e.target.value);
    if (e.target.value.length > 10) setBuildingNameError("Too large name!");
    else if (e.target.value.length === 0)
      setBuildingNameError("Name must not be empty");
    else setBuildingNameError("");
  };
  return (
    // <CardList cards={[1, 2, 3]} title={"Model's Bounding Boxes"}></CardList>
    <div style={pageContainer}>
      <div style={containerStyle}>
        {width > 900 && (
          <div
            style={{
              ...columnStyleSecondary,
              ...{ flex: showDetails ? 5 : 1 },
            }}
          >
            {showOtherFields && !isLoadingInference && currentFileName && (
              <button
                onClick={() => {
                  setShowDetails(!showDetails);
                }}
                className="details-button"
                style={showDetailsButton}
              >
                <FontAwesomeIcon
                  icon={showDetails ? faArrowLeft : faArrowRight}
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
              {(!showOtherFields || !currentFileName) && (
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
        <div style={columnStyleMain}>
          <FloorPlanImage
            setFileType={setFileType}
            setBuildingImgSrc={setBuildingImgSrc}
            setShowDetails={setShowDetails}
            setIsLoadingInference={setIsLoadingInference}
            isLoadingInference={isLoadingInference}
            onDeleteDoor={onDeleteCard}
            imageDimensions={imageDimensions}
            generateXML={generateXML}
            generateCSV={generateCSV}
            setImageDimensions={setImageDimensions}
            setCurrentFileName={setCurrentFileName}
            setShowOtherFields={setShowOtherFields}
            highlightedBox={highlightedBox}
            setHighlightedBox={setHighlightedBox}
            currentBoundingBoxes={currentBoundingBoxes}
            setCurrentBoundingBoxes={setCurrentBoundingBoxes}
            setDetectedBoundingBoxes={setDetectedBoundingBoxes}
            detectedBoundingBoxes={detectedBoundingBoxes}
            setBuildingNameError={setBuildingNameError}
            setBuildingName={setBuildingName}
            currentFileName={currentFileName}
            imageSrc={
              "https://wpmedia.roomsketcher.com/content/uploads/2022/01/06145940/What-is-a-floor-plan-with-dimensions.png"
            } // Replace with your image URL
          />
          {!isLoadingInference && showOtherFields && currentFileName && (
            <div
              style={{
                width: "600px",
                display: "flex",
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 30,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {!buildingImgSrc && (
                  <FileInputComponent
                    errorMessage={fileTypeError}
                    setFileType={setFileType}
                    onChangeMethod={handleBuildingImage}
                    style={{
                      width: "600px",
                      borderColor: fileTypeError ? "red" : "#d1d5db",
                      backgroundColor: fileTypeError
                        ? "rgb(194, 156, 160)"
                        : "#f9fafb",
                    }}
                    customMessage={"Click to upload the image of your building"}
                  />
                )}
                {buildingImgSrc && (
                  <ImageDisplay
                    imageSrc={buildingImgSrc}
                    onCancel={() => setBuildingImgSrc(null)}
                    onDownload={() => downloadImage(buildingImgSrc)}
                  />
                )}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder={"Enter building's name"}
                    style={{
                      ...nameInput,
                      backgroundColor: buildingNameError
                        ? "rgb(206, 83, 83)"
                        : "#f0f8ff",
                    }}
                    onFocus={(e) =>
                      (e.target.style.backgroundColor = "#e0f7fa")
                    }
                    onBlur={(e) => (e.target.style.backgroundColor = "#f0f8ff")}
                    onChange={handleBuildingName}
                  />{" "}
                </div>
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  }}
                >
                  <p
                    style={{
                      position: "fixed",
                      marginTop: -10,
                      color: "rgb(206, 83, 83)",
                    }}
                  >
                    {buildingNameError}
                  </p>
                </div>
              </div>
              <button
                class="submit-btn"
                disabled={
                  fileTypeError ||
                  buildingNameError ||
                  buildingName.length === 0 ||
                  !buildingImgSrc
                }
                style={submitButton}
                onClick={() => alert("Submitted!")}
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnotateFloorPlan;
