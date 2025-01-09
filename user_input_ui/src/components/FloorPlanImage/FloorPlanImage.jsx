import React, { useState, useRef, useEffect, useContext } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Audio } from "react-loader-spinner";
import { Tooltip, TooltipProvider } from "react-tooltip";
import {
  ImageContainer,
  Rectangle,
  buttonsContainer,
  container,
  currentRoom,
  currentRoomContainer,
  errorMessage,
  imageContainer,
} from "./FloorPlanImage";
import { drawLightPolygon } from "../../utils/drawPolygon";
import FileInputComponent from "../FileInput/FileInput.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { faCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { WindowSizeContext } from "../../context/WindowSize/WindowSize.jsx";
import Modal from "../Modal/Modal.jsx";

const validFileTypes = ["png", "jpeg", "jpg"];

const isPointInPolygon = (point, polygon) => {
  let { x, y } = point;
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let { x: xi, y: yi } = polygon[i];
    let { x: xj, y: yj } = polygon[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) isInside = !isInside;
  }
  return isInside;
};

const isPointInBox = (point, box) => {
  let { x, y } = point;
  return (
    x >= box.x &&
    y >= box.y &&
    x <= box.x + box.width &&
    y <= box.y + box.height
  );
};

const FloorPlanImage = ({
  generateXML,
  generateCSV,
  setImageDimensions,
  imageDimensions,
  setCurrentFileName,
  currentBoundingBoxes,
  setCurrentBoundingBoxes,
  setDetectedBoundingBoxes,
  detectedBoundingBoxes,
  highlightedBox,
  setHighlightedBox,
  onDeleteDoor,
  isLoadingInference,
  setIsLoadingInference,
  setShowDetails,
  setShowOtherFields,
  setBuildingImgSrc,
  setBuildingName,
  setBuildingNameError,
  currentFileName,
  imageSrc,
  setImageSrc,
  setInferenceError,
  roomData,
  setRoomData,
  doorDeleted,
  setDoorDeleted,
  setDistancePerPixel,
  distancePerPixel,
}) => {
  const [isDrawing, setIsDrawing] = useState(false); // Track if the user is currently drawing a box
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 }); // Starting coordinates of the box
  const [currentBox, setCurrentBox] = useState(null); // Current bounding box being drawn
  const [currentLine, setCurrentLine] = useState(null);
  const [ctrlPressed, setCtrlPressed] = useState(false); // Check if the Ctrl key is pressed
  const [imageCursor, setImageCursor] = useState("grab"); // Cursor state for different interactions
  const [imageIsGrabbed, setImageIsGrabbed] = useState(false); // Image grab state
  const [roomToLabel, setRoomToLabel] = useState(null); // The room to label
  const [showModal, setShowModal] = useState(false); // Whether to show the modal
  const [showLineModal, setShowLineModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(""); // Selected label from the dropdown
  const [customLabel, setCustomLabel] = useState(""); // Custom label text
  const [boxToLabel, setBoxToLabel] = useState(null); // The bounding box that needs labeling
  const [fileType, setFileType] = useState(null);
  const [fileTypeError, setFileTypeError] = useState("");
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [shiftPressed, setShiftPressed] = useState(false);
  const [tempDistance, setTempDistance] = useState(0);
  const [pixelDistance, setPixelDistance] = useState(0);
  // const [currentCsvRecords, setCurrentCsvRecords] = useState([]);
  // const [currentCsvRecord, setCurrentCsvRecord] = useState([]);
  const [highlightedRoom, setHighlightedRoom] = useState(null); // Room to be highlighted
  const { width: windowWidth, height } = useContext(WindowSizeContext);

  // const [roomData, setRoomData] = useState([]);
  const transformWrapperRef = useRef(null);

  // Function to place the rubbish bin at specific position
  const placeRubbishBin = (x, y) => {
    return (
      <a
        onClick={() => {
          onDeleteDoor(
            highlightedBox.x,
            highlightedBox.y,
            highlightedBox.width,
            highlightedBox.weight,
            3
          );
          // setDoorDeleted(true);
          // zoomToBox(highlightedBox);
        }}
      >
        <FontAwesomeIcon
          icon={!doorDeleted ? faTrash : null}
          size="2x"
          style={{
            cursor: "pointer",
            position: "fixed",
            color: "red",
            top: y,
            left: x,
            zIndex: 1,
            transform: "scale(0.5)",
          }}
        />
      </a>
    );
  };

  const zoomToBox = (box) => {
    const { x, y, width, height } = box;

    if (transformWrapperRef.current) {
      const { setTransform } = transformWrapperRef.current;

      // Calculate the zoom level based on the box size
      const targetZoom = imageDimensions.width / 350;

      // Calculate the center of the bounding box
      const centerX = x + width / 2;
      const centerY = y + height / 2;

      let offX = 0;
      if (imageDimensions.width > Math.max(500, 0.35 * windowWidth))
        offX =
          Math.min(imageDimensions.width, Math.max(500, 0.35 * windowWidth)) /
          targetZoom;

      // Adjust the view to center the box and apply the zoom level
      setTransform(
        -centerX * targetZoom + imageDimensions.width / 2 - offX, // offset by half of the window width
        -centerY * targetZoom + imageDimensions.height / 2, // offset by half of the window height
        targetZoom,
        1000, // Duration of the animation (600ms)
        "easeOutQuad" // Easing function
      );
    }
  };

  useEffect(() => {
    if (
      imageSrc &&
      roomData.length === 0 &&
      detectedBoundingBoxes.length === 0
    ) {
      setIsLoadingInference(true);
      const sendImageToServer = async () => {
        let base64String = imageSrc;

        if (imageSrc.startsWith("<img") || imageSrc.startsWith("data:image")) {
          base64String = imageSrc.split(",")[1];
        }

        // Now you have the pure base64 string
        console.log("Base64 String:", base64String);

        const formData = new FormData();
        formData.append("image", base64String); // Attach the base64 string to the FormData

        try {
          const response = await fetch(
            "http://127.0.0.1:5000/predict_doors_yolo11",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ image: base64String }),
            }
          );
          console.log("DIM", imageDimensions);
          const responseForRooms = await fetch(
            "http://127.0.0.1:5000/predict_rooms",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                image: base64String,
                imageDimensions: { ...imageDimensions },
              }),
            }
          );

          console.log("ROOMS", responseForRooms);
          if (responseForRooms.ok) {
            const dataRomms = await responseForRooms.json();
            setRoomData(dataRomms);
            console.log("Server response:", dataRomms);
          } else {
            console.error("Error from server:", await responseForRooms.text());
          }

          if (response.ok) {
            const data = await response.json();
            console.log(data.formatted_bboxes);
            setDetectedBoundingBoxes(data.formatted_bboxes);
            console.log("Server response:", data);
          } else {
            console.error("Error from server:", await response.text());
          }
          setIsLoadingInference(false);
          setInferenceError("");
        } catch (error) {
          setInferenceError(
            error?.message || "Error when analyzing the floor plan. Try again!"
          );
          console.error("Error during image upload:", error);
          setIsLoadingInference(false);
        }
      };
      console.log("CHANGE", currentFileName);
      imageDimensions.width !== 0 && sendImageToServer();
    }
  }, [imageSrc, imageDimensions.width]);

  const highlightRoom = (highlightedRoom) => {
    if (!ctrlPressed) {
      const canvas = canvasRoomsRef?.current;
      const ctx = canvas?.getContext("2d");
      drawLightPolygon(canvas, ctx, highlightedRoom?.points || []);
    }
  };

  const canvasRef = useRef(null);
  const canvasRoomsRef = useRef(null);
  const imageRef = useRef(null);

  // Handle key events for Ctrl key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "Control" ||
        e.key === "ControlLeft" ||
        e.key === "ControlRight"
      ) {
        setCtrlPressed(true);
      }
      if (e.key === "Shift") {
        setShiftPressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (
        e.key === "Control" ||
        e.key === "ControlLeft" ||
        e.key === "ControlRight"
      ) {
        setCtrlPressed(false);
      }
      if (e.key === "Shift") {
        setShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (detectedBoundingBoxes.length === 0) {
      if (!validFileTypes.includes(fileType)) {
        setShowOtherFields(false);
        if (fileType !== null && fileType !== "") {
          setFileTypeError(`${fileType} is not supported!`);
          setImageSrc(null);
          setCurrentFileName(null);
        }
      } else {
        setTimeout(() => {
          setShowOtherFields(true);
          setFileTypeError("");
        }, 200);
      }
    }
  }, [fileType, imageSrc]);

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0]; // Get the selected file
    if (file) {
      setFileType(file.type.split("/")[1]);
      setCurrentFileName(file.name);
      console.log("HAHA", file.type.split("/")[1]);
      if (validFileTypes.includes(file.type.split("/")[1])) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageSrc = reader.result;
          setImageSrc(imageSrc); // Set image source to the result of FileReader

          // Create an Image object to load the image and retrieve dimensions
          const img = new Image();
          img.onload = () => {
            console.log("Image Width:", img.width);
            console.log("Image Height:", img.height);

            // Optionally store the dimensions in the state
            setImageDimensions({
              width: img.width,
              height: img.height,
              depth: 3,
            });
            console.log(img);
          };
          img.src = imageSrc; // Trigger the image load
        };
        reader.readAsDataURL(file); // Read the file as a data URL
      }
    }
  };

  // Draw bounding boxes and the current box being drawn
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current) return; // Ensure canvas and image are available

    const canvas = canvasRef.current;
    const canvasRooms = canvasRoomsRef.current;
    const ctx = canvas.getContext("2d");
    const image = imageRef.current;

    if (image && canvas) {
      canvas.width = image.width;
      canvas.height = image.height;
      canvasRooms.width = image.width;
      canvasRooms.height = image.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before re-drawing
      // Draw the image
      ctx.drawImage(image, 0, 0);

      // Draw all the bounding boxes
      detectedBoundingBoxes.concat(currentBoundingBoxes).forEach((box) => {
        ctx.beginPath();
        ctx.rect(box.x, box.y, box.width, box.height);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "red";

        if (
          highlightedBox &&
          highlightedBox.x === box.x &&
          highlightedBox.y === box.y &&
          highlightedBox.width === box.width &&
          highlightedBox.height === box.height
        ) {
          if (!isPointInBox({ x: cursor.x, y: cursor.y }, highlightedBox))
            zoomToBox(highlightedBox);
          ctx.strokeStyle = "purple"; // Highlight the box with a blue color
          ctx.lineWidth = 4; // Make the border thicker
        } else {
          ctx.strokeStyle = "rgb(85, 190, 162)"; // Default color for other boxes
        }
        ctx.stroke();

        // Optionally, add label to the bounding box
        ctx.fillStyle = "red";
        ctx.fillText(box.label || "", box.x, box.y - 5);
      });

      // Draw the current bounding box while the user is drawing
      if (isDrawing && currentBox && ctrlPressed) {
        ctx.beginPath();
        ctx.rect(
          currentBox.x,
          currentBox.y,
          currentBox.width,
          currentBox.height
        );
        ctx.lineWidth = 2;
        ctx.strokeStyle = "green"; // Green for the active bounding box
        ctx.stroke();
      }
      if (currentLine) {
        ctx.beginPath();
        ctx.moveTo(currentLine.startX, currentLine.startY); // Starting point of the line
        ctx.lineTo(currentLine.endX, currentLine.endY); // Ending point of the line
        ctx.lineWidth = 3;
        ctx.strokeStyle = "red"; // Green for the active line
        ctx.stroke();
      }
    }
  }, [
    currentBoundingBoxes,
    detectedBoundingBoxes,
    isDrawing,
    isDrawingLine,
    currentBox,
    currentLine,
    highlightedBox,
    imageSrc, // Redraw when image is uploaded
  ]);

  const grabImage = () => {
    setImageIsGrabbed(true);
  };

  const leaveImage = () => {
    setImageIsGrabbed(false);
  };

  // Mouse down event to start drawing the bounding box
  const handleMouseDown = (e) => {
    if (!ctrlPressed && !shiftPressed) return; // Only allow drawing if Ctrl is pressed
    const { offsetX, offsetY } = e.nativeEvent;
    setStartPoint({ x: offsetX, y: offsetY });
    if (ctrlPressed) {
      // Set the starting point of the box
      setIsDrawing(true); // Indicate that the user is drawing
      setCurrentBox({
        x: offsetX,
        y: offsetY,
        width: 0,
        height: 0,
      });
    } else if (shiftPressed) {
      setIsDrawingLine(true); // Indicate that the user is drawing
      setCurrentLine({
        startX: offsetX,
        startY: offsetY,
        endX: offsetX,
        endY: offsetY,
      });
    }
  };

  const handleCancelLineModal = () => {
    setShowLineModal(false);
    setCurrentLine(null);
  };

  const handleSubmitDistancePerPixel = () => {
    setDistancePerPixel(tempDistance / pixelDistance);
    setCurrentLine(null);
    setShowLineModal(false);
  };

  const handleChangeDistancePerPixel = (e) => {
    setTempDistance(e.target.value);
  };

  // Mouse move event to update the current bounding box while dragging
  const handleMouseMove = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setCursor({ x: offsetX, y: offsetY });
    // setHighlightedBox(null);
    currentBoundingBoxes.concat(detectedBoundingBoxes).forEach((box) => {
      if (isPointInBox({ x: offsetX, y: offsetY }, box)) {
        setHighlightedBox(box);
        setDoorDeleted(false);
      }
    });

    const width = offsetX - startPoint.x;
    const height = offsetY - startPoint.y;
    setTimeout(() => {
      // Check if the mouse is inside any room and highlight the room
      for (const room of roomData) {
        if (isPointInPolygon({ x: offsetX, y: offsetY }, room.points)) {
          setHighlightedRoom(room); // Set the highlighted room
          highlightRoom(room);
          return;
        }
      }

      // Reset the highlighted room if the mouse is not inside any room
      setHighlightedRoom(null);
      highlightRoom(null);
    }, [1]);

    if ((!isDrawing && !isDrawingLine) || (!ctrlPressed && !shiftPressed))
      return; // Only update if the user is drawing

    // Update the current box dimensions
    ctrlPressed &&
      setCurrentBox({
        x: startPoint.x,
        y: startPoint.y,
        width: width,
        height: height,
      });
    shiftPressed &&
      setCurrentLine({
        startX: startPoint.x,
        startY: startPoint.y,
        endX: offsetX,
        endY: offsetY,
      });
    // setCurrentCsvRecord({
    //   filename: fileName,
    //   width: 500,
    //   height: 500,
    //   class: "door",
    //   xmin: startPoint.x,
    //   ymin: startPoint.y,
    //   xmax: startPoint.x + width,
    //   ymax: startPoint.y + height,
    // });

    // setCurrentCsvRecords(
    //   `${fileName}, 500, 500, door, ${startPoint.x}, ${startPoint.y}, ${
    //     startPoint.x + width
    //   }, ${startPoint.y + height}`
    // );
  };

  // Mouse up event to finalize the bounding box and trigger the modal
  const handleMouseUp = () => {
    if (!isDrawing && !isDrawingLine) return; // Only add the box if drawing is in progress
    // console.log(currentCsvRecords);
    // setCurrentCsvRecords([...currentCsvRecords, currentCsvRecord]);
    if (isDrawing) {
      setIsDrawing(false); // End drawing
      if (currentBox) {
        const newBox = { ...currentBox, label: "door" };
        setCurrentBoundingBoxes((prevBoxes) => [...prevBoxes, newBox]); // Add new box to the list
        setBoxToLabel(newBox); // Set the box to label
        // setShowModal(true); // Show the modal for labeling
      }
    }
    if (isDrawingLine) {
      setIsDrawingLine(false); // End drawing
      console.log("CUR LINE", currentLine);
      if (currentLine) {
        setPixelDistance(
          Math.sqrt(
            (currentLine.startX - currentLine.endX) ** 2 +
              (currentLine.startY - currentLine.endY) ** 2
          )
        );
        setShowLineModal(true);
      }
    }
  };

  // Handle right-click event for labeling the bounding box
  const handleRightClick = (e) => {
    e.preventDefault(); // Prevent the default right-click menu
    const { offsetX, offsetY } = e.nativeEvent;
    const clickedPoint = { x: offsetX, y: offsetY };

    // Check if the clicked point is inside any room
    for (const room of roomData) {
      if (isPointInPolygon(clickedPoint, room.points)) {
        setRoomToLabel(room);
        setShowModal(true);
        return;
      }
    }
  };

  // Handle label selection change
  const handleLabelChange = (e) => {
    setSelectedLabel(e.target.value);
  };

  // Handle custom label change
  const handleCustomLabelChange = (e) => {
    setCustomLabel(e.target.value);
  };

  // Handle the modal OK button
  const handleModalOK = () => {
    if (selectedLabel || customLabel) {
      const labelToUse = selectedLabel || customLabel;
      if (labelToUse) {
        // Update the bounding box with the selected or custom label
        const updatedRooms = roomData.map((room) =>
          room === roomToLabel ? { ...room, label: labelToUse } : room
        );
        setRoomData(updatedRooms);
      }
      setShowModal(false);
      setSelectedLabel("");
      setCustomLabel("");
      setImageCursor("grab");
    }
  };

  const handleModalCancel = () => {
    // setCurrentBoundingBoxes((prevBoxes) =>
    //   prevBoxes.filter((box) => box !== boxToLabel)
    // );
    setShowModal(false);
    setImageCursor("grab");
  };

  useEffect(() => {
    if (ctrlPressed) {
      setImageCursor("crosshair");
    } else if (imageIsGrabbed && !ctrlPressed) {
      setImageCursor("grabbing");
    } else {
      setImageCursor("grab");
    }

    if (shiftPressed) {
      setImageCursor("cell");
    }
  }, [imageIsGrabbed, ctrlPressed, shiftPressed]);

  console.log(Math.max(500, 0.35 * windowWidth));

  return (
    <div style={imageContainer}>
      {imageSrc && !isLoadingInference && (
        <div
          style={{
            ...currentRoomContainer,
            ...{ width: `${Math.min(500, imageDimensions.width)}px` },
          }}
        >
          <p style={currentRoom}>
            Current Room: {highlightedRoom ? highlightedRoom.label : "-"}
          </p>
        </div>
      )}
      {!imageSrc && (
        <FileInputComponent
          errorMessage={fileTypeError}
          customMessage={"Click to upload your floor plan"}
          setFileType={setFileType}
          style={{
            borderColor: fileTypeError ? "red" : "#d1d5db",
            backgroundColor: fileTypeError ? "rgb(194, 156, 160)" : "#f9fafb",
          }}
          onChangeMethod={handleImageChange}
        />
      )}
      {/* <p style={errorMessage}>{fileTypeError}</p> */}
      {isLoadingInference && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "start",
            gap: 10,
          }}
        >
          <Audio
            height="80"
            width="80"
            radius="9"
            color="white"
            ariaLabel="loading"
            wrapperStyle
            wrapperClass
          />
          <p style={{ color: "white", fontSize: 30 }}>Loading...</p>
        </div>
      )}

      {imageSrc && !isLoadingInference && (
        <Rectangle
          style={{
            width: `${Math.min(
              imageDimensions.width,
              Math.max(500, 0.35 * windowWidth)
            )}px`,
            height: `${Math.min(
              imageDimensions.width,
              Math.max(500, 0.35 * windowWidth)
            )}px`,
            borderRadius: 20,
          }}
        >
          <TransformWrapper
            ref={transformWrapperRef}
            initialScale={1.2}
            initialPositionX={0}
            initialPositionY={0}
            disabled={ctrlPressed || shiftPressed}
            limitToBounds={false}
          >
            <ImageContainer
              style={{
                cursor: imageCursor,
                display: "flex", // Flexbox for the image container
                justifyContent: "center", // Center image horizontally
                alignItems: "center", // Center image vertically
                position: "relative", // Allows overlay of canvases
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onContextMenu={handleRightClick} // Right-click event
            >
              <TransformComponent
                onMouseDown={grabImage}
                onMouseUp={leaveImage}
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Uploaded Floor Plan"
                  style={{
                    maxHeight: "none",
                    maxWidth: "none",
                    objectFit: "contain",
                  }}
                />
                {highlightedBox &&
                  placeRubbishBin(
                    highlightedBox?.x + highlightedBox.width - 3,
                    highlightedBox?.y - 10
                  )}
                <canvas
                  ref={canvasRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                  }}
                />
                <canvas
                  ref={canvasRoomsRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                  }}
                />
              </TransformComponent>
            </ImageContainer>
          </TransformWrapper>
        </Rectangle>
      )}

      {/* Modal for labeling the bounding box */}
      {showModal && (
        <Modal
          forDistancePerPixel={false}
          forRooms={true}
          disabledOK={!selectedLabel && !customLabel}
          handleCancel={handleModalCancel}
          handleSubmit={handleModalOK}
          title={`Label the ${roomToLabel.label}`}
          handleInputValue={handleCustomLabelChange}
          inputValue={customLabel}
        />
      )}
      {showLineModal && (
        <Modal
          forDistancePerPixel={true}
          forRooms={false}
          disabledOK={tempDistance === 0 || !tempDistance || tempDistance < 0}
          handleCancel={handleCancelLineModal}
          handleSubmit={handleSubmitDistancePerPixel}
          title={`Add the distance (in meters)`}
          handleInputValue={handleChangeDistancePerPixel}
          inputValue={tempDistance}
        />
      )}
      {imageSrc && !isLoadingInference && (
        <div style={buttonsContainer}>
          {" "}
          <button
            id="tooltip-button4"
            className="cancel"
            onClick={() => {
              // setImageSrc(null);
              // setCurrentBoundingBoxes([]);
              // setDetectedBoundingBoxes([]);
              // setCurrentFileName(null);
              // setShowDetails(false);
              // setShowOtherFields(false);
              // setBuildingImgSrc(null);
              // setBuildingName("");
              // setBuildingNameError("");
              // setImageDimensions({ width: 0, height: 0, depth: 3 });
              window.location.reload();
            }}
          >
            Back <Tooltip anchorId="tooltip-button4" content="Go back" />
          </button>
          <button id="tooltip-button3" onClick={generateCSV}>
            Download CSV{" "}
            <Tooltip
              anchorId="tooltip-button3"
              content="Extract annotations in CSV format"
            />
          </button>
          <button id="tooltip-button2" className="yellow" onClick={generateXML}>
            Download XML
            <Tooltip
              anchorId="tooltip-button2"
              content="Extract annotations in XML format"
            />
          </button>
          <button
            style={{ background: "none", transform: "scale(1.5)" }}
            onClick={() =>
              zoomToBox({
                x: imageDimensions.width / 2,
                y: imageDimensions.height / 2,
                width: 5,
                height: 5,
              })
            }
          >
            <FontAwesomeIcon icon={faCrosshairs} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FloorPlanImage;
