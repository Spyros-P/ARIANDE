import React, { useContext, useState } from "react";
import axios from "axios";
import { CardList } from "../../components/CardList/CardList.jsx";
import FloorPlanImage from "../../components/FloorPlanImage/FloorPlanImage.jsx";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Audio } from "react-loader-spinner";

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
import { base64ToBlob } from "../../utils/base64ToBlob.js";
import { createBuildingReqBody } from "../../utils/createBuildingReqBody.js";
import { JWTContext } from "../../context/Auth/AuthContext.js";

const validFileTypes = ["png", "jpeg", "jpg"];
const AnnotateFloorPlan = () => {
  const [currentBoundingBoxes, setCurrentBoundingBoxes] = useState([]);
  const [detectedBoundingBoxes, setDetectedBoundingBoxes] = useState([]);
  const [roomData, setRoomData] = useState([]);
  const [highlightedBox, setHighlightedBox] = useState(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
    depth: 3,
  });
  const [showDetails, setShowDetails] = useState(true);
  const [showOtherFields, setShowOtherFields] = useState(false);

  const [isLoadingInference, setIsLoadingInference] = useState(false);
  const [fileType, setFileType] = useState(null);
  const [fileTypeError, setFileTypeError] = useState("");
  const [buildingImgSrc, setBuildingImgSrc] = useState(null);
  const [buildingName, setBuildingName] = useState("");
  const [buildingNameError, setBuildingNameError] = useState("");
  const [floorPlanImageSrc, setFloorPlanImageSrc] = useState(null); // State to store the uploaded image
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [inferenceError, setInferenceError] = useState("");
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [doorDeleted, setDoorDeleted] = useState(false);
  const [distancePerPixel, setDistancePerPixel] = useState(0);
  const [uploadingStatus, setUploadingStatus] = useState("");

  const { width, height } = useContext(WindowSizeContext);
  const { jwt } = useContext(JWTContext);

  const handleLat = (e) => {
    setLat(e.target.value);
  };

  const handleLon = (e) => {
    setLon(e.target.value);
  };

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
    setDoorDeleted(true);
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
    if (e.target.value.length > 15) setBuildingNameError("Too large name!");
    else if (e.target.value.length === 0)
      setBuildingNameError("Name must not be empty");
    else setBuildingNameError("");
  };

  const uploadImage = async (imageBase64, imageName) => {
    const formData = new FormData();
    const contentType = imageBase64.split(":")[1].split(";")[0];
    // Create Blob and append to FormData
    const imageBlob = base64ToBlob(imageBase64, contentType);
    formData.append(
      "files",
      imageBlob,
      `${imageName}-${Math.random().toString().split(".")[1].slice(0, 7)}.${
        contentType.split("/")[1]
      }`
    );

    // Upload to Strapi
    const response = await axios.post(
      `${process.env.REACT_APP_STRAPI_URL}/api/upload`,

      formData,
      {
        headers: {
          Authorization: `Bearer ${jwt}`, // Add API Key here
        },
      }
    );

    return response.data[0].id;
  };

  const handleSubmitToStrapi = async () => {
    let graph = {};
    setIsLoadingSubmit(true);

    try {
      setUploadingStatus("Uploading building image...");
      let buildingImageID = await uploadImage(buildingImgSrc, buildingName);
      setUploadingStatus("Uploading floor plan image...");
      let floorPlanImageID = await uploadImage(
        floorPlanImageSrc,
        currentFileName
      );

      setUploadingStatus("Constructing graph...");
      const graph_response = await fetch(
        `http://127.0.0.1:5000/post_user_feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            doors: detectedBoundingBoxes.concat(currentBoundingBoxes),
            rooms: roomData,
            distancePerPixel: distancePerPixel,
          }),
        }
      );

      if (graph_response.ok) {
        graph = await graph_response.json();
        console.log("Server Response : ", graph.graph);
      } else {
        console.error("Error from server:", await graph_response.text());
      }

      const response = await axios.post(
        `${process.env.REACT_APP_STRAPI_URL}/api/buildings?status=draft`,
        createBuildingReqBody(
          buildingName,
          floorPlanImageID,
          buildingImageID,
          lat,
          lon,
          graph.graph
        ),
        {
          headers: {
            Authorization: `Bearer ${jwt}`, // Add API Key here
          },
        }
      );
      setIsSubmitted(true);
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      // setIsSubmitted(false);
      setSubmitError(error?.message || "An error occured. Please try again!");

      setTimeout(() => {
        setIsLoadingSubmit(false);
        setSubmitError("");
      }, 3000);
    }
  };
  return (
    // <CardList cards={[1, 2, 3]} title={"Model's Bounding Boxes"}></CardList>
    <div style={pageContainer}>
      <div style={containerStyle}>
        {inferenceError && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <p
              style={{
                color: "rgb(192, 79, 79)",
                fontSize: 30,
              }}
            >
              {inferenceError}
            </p>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="cancel"
            >
              Reload
            </button>
          </div>
        )}
        {width > 900 && !inferenceError && (
          <div
            style={{
              ...columnStyleSecondary,
              ...{ flex: showDetails ? 5 : 1 },
            }}
          >
            {showOtherFields &&
              !isLoadingInference &&
              currentFileName &&
              !isLoadingSubmit && (
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
              {currentFileName &&
                showDetails &&
                !isLoadingInference &&
                !isLoadingSubmit && (
                  <>
                    {" "}
                    <CardList
                      size="medium"
                      onDeleteCard={(x, y, w, h) => {
                        onDeleteCard(x, y, w, h, 1);
                      }}
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
                    <p style={{ color: "white", fontSize: "18px" }}>
                      Distance per 1000 pixel:{" "}
                      {(1000 * distancePerPixel).toFixed(2)} m.
                    </p>
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
        {!isLoadingSubmit && !inferenceError && (
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
              setImageSrc={setFloorPlanImageSrc}
              imageSrc={floorPlanImageSrc}
              setInferenceError={setInferenceError}
              roomData={roomData}
              setDoorDeleted={setDoorDeleted}
              doorDeleted={doorDeleted}
              setRoomData={setRoomData}
              setDistancePerPixel={setDistancePerPixel}
              distancePerPixel={distancePerPixel}
            />
            {!isLoadingInference && showOtherFields && currentFileName && (
              <div
                style={{
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
                      customMessage={
                        "Click to upload the image of your building"
                      }
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
                      value={buildingName}
                      type="text"
                      placeholder={"Enter building's name"}
                      style={{
                        ...nameInput,
                        backgroundColor: buildingNameError
                          ? "rgb(206, 83, 83)"
                          : "#f0f8ff",
                      }}
                      onChange={handleBuildingName}
                    />{" "}
                    <p
                      style={{
                        marginTop: -10,
                        color: "rgb(206, 83, 83)",
                      }}
                    >
                      {buildingNameError}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 10,
                      }}
                    >
                      <input
                        value={lat}
                        type="number"
                        placeholder={"lat"}
                        id="floatInput"
                        style={{
                          ...nameInput,
                          width: "20%",
                        }}
                        step="0.01"
                        onChange={handleLat}
                      />{" "}
                      <input
                        value={lon}
                        type="number"
                        step="0.01"
                        id="floatInput"
                        placeholder={"lon"}
                        style={{
                          ...nameInput,
                          width: "20%",
                        }}
                        onChange={handleLon}
                      />{" "}
                    </div>
                  </div>
                </div>
                <button
                  class="submit-btn"
                  disabled={
                    fileTypeError ||
                    buildingNameError ||
                    buildingName.length === 0 ||
                    !buildingImgSrc ||
                    !lat ||
                    !lon ||
                    !distancePerPixel ||
                    distancePerPixel === 0
                  }
                  style={submitButton}
                  onClick={handleSubmitToStrapi}
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        )}
        {isLoadingSubmit && (
          <div style={columnStyleMain}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "start",
                gap: 10,
              }}
            >
              {!isSubmitted && !submitError && (
                <Audio
                  height="80"
                  width="80"
                  radius="9"
                  color="white"
                  ariaLabel="loading"
                  wrapperStyle
                  wrapperClass
                />
              )}
              {isLoadingSubmit && !isSubmitted && !submitError && (
                <p
                  style={{
                    color: "white",
                    fontSize: 30,
                  }}
                >
                  {uploadingStatus}
                </p>
              )}
              {isSubmitted && (
                <p
                  style={{
                    color: "rgb(54, 223, 195)",
                    fontSize: 30,
                  }}
                >
                  Your building was uploaded!
                </p>
              )}

              {submitError && (
                <p
                  style={{
                    color: "rgb(214, 76, 76)",
                    fontSize: 30,
                  }}
                >
                  {submitError}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnotateFloorPlan;
