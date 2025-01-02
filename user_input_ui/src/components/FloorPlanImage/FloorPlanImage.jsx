import React, { useState, useRef, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
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

const validFileTypes = ["png", "jpeg", "jpg"];

const isPointInPolygon = (point, polygon) => {
  let [x, y] = point;
  let isInside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let [xi, yi] = polygon[i];
    let [xj, yj] = polygon[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) isInside = !isInside;
  }
  return isInside;
};

const FloorPlanImage = ({
  generateXML,
  generateCSV,
  setImageDimensions,
  setCurrentFileName,
  currentBoundingBoxes,
  setCurrentBoundingBoxes,
  setDetectedBoundingBoxes,
  detectedBoundingBoxes,
  highlightedBox,
}) => {
  const [isDrawing, setIsDrawing] = useState(false); // Track if the user is currently drawing a box
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 }); // Starting coordinates of the box
  const [currentBox, setCurrentBox] = useState(null); // Current bounding box being drawn
  const [ctrlPressed, setCtrlPressed] = useState(false); // Check if the Ctrl key is pressed
  const [imageCursor, setImageCursor] = useState("grab"); // Cursor state for different interactions
  const [imageIsGrabbed, setImageIsGrabbed] = useState(false); // Image grab state
  const [roomToLabel, setRoomToLabel] = useState(null); // The room to label
  const [showModal, setShowModal] = useState(false); // Whether to show the modal
  const [selectedLabel, setSelectedLabel] = useState(""); // Selected label from the dropdown
  const [customLabel, setCustomLabel] = useState(""); // Custom label text
  const [boxToLabel, setBoxToLabel] = useState(null); // The bounding box that needs labeling
  const [imageSrc, setImageSrc] = useState(null); // State to store the uploaded image
  const [fileType, setFileType] = useState(null);
  const [fileTypeError, setFileTypeError] = useState("");
  // const [currentCsvRecords, setCurrentCsvRecords] = useState([]);
  // const [currentCsvRecord, setCurrentCsvRecord] = useState([]);
  const [highlightedRoom, setHighlightedRoom] = useState(null); // Room to be highlighted

  const [roomData, setRoomData] = useState([
    {
      floor: 0,
      label: "Living Room",
      coords: [
        [47, 405],
        [48, 404],
        [261, 404],
        [262, 405],
        [262, 497],
        [261, 498],
        [48, 498],
        [47, 497],
        [47, 405],
      ],
    },
    {
      floor: 0,
      label: "Bathroom",
      coords: [
        [47, 257],
        [48, 256],
        [182, 256],
        [183, 257],
        [183, 396],
        [182, 397],
        [164, 397],
        [163, 398],
        [48, 398],
        [47, 397],
        [47, 257],
      ],
    },
    {
      floor: 0,
      label: "Kitchen",
      coords: [
        [268, 26],
        [269, 25],
        [428, 25],
        [429, 26],
        [429, 497],
        [428, 498],
        [269, 498],
        [268, 497],
        [268, 398],
        [190, 398],
        [189, 397],
        [189, 250],
        [48, 250],
        [47, 249],
        [47, 146],
        [48, 145],
        [261, 145],
        [262, 146],
        [262, 248],
        [268, 248],
        [268, 26],
      ],
    },
    {
      floor: 0,
      label: "Bedroom",
      coords: [
        [168, 26],
        [169, 25],
        [261, 25],
        [262, 26],
        [262, 138],
        [261, 139],
        [169, 139],
        [168, 138],
        [168, 26],
      ],
    },
    {
      floor: 0,
      label: "Office",
      coords: [
        [47, 26],
        [48, 25],
        [161, 25],
        [162, 26],
        [162, 138],
        [161, 139],
        [48, 139],
        [47, 138],
        [47, 26],
      ],
    },
  ]);

  // useEffect(() => {
  //   const canvas = canvasRef?.current;
  //   const ctx = canvas?.getContext("2d");
  //   if (highlightedRoom) {
  //     console.log(highlightedRoom?.label);
  //     drawLightPolygon(canvas, ctx, highlightedRoom.coords);
  //   }
  // }, highlightedRoom);

  useEffect(() => {
    if (imageSrc) {
      const sendImageToServer = async () => {
        let base64String = imageSrc;
  
        if (imageSrc.startsWith("<img") || imageSrc.startsWith("data:image")) {
          base64String = imageSrc.split(',')[1]; 
        }
  
        // Now you have the pure base64 string
        console.log("Base64 String:", base64String);
  
        const formData = new FormData();
        formData.append("image", base64String); // Attach the base64 string to the FormData
  
        try {
          const response = await fetch("http://127.0.0.1:5000/predict_doors", {
            method: "POST",
            headers: {
              "Content-Type": "application/json", // Setting header for JSON payload
            },
            body: JSON.stringify({ image: base64String }), // Send base64 string in the JSON body
          });
  
          if (response.ok) {
            const data = await response.json();
            console.log(data.formatted_bboxes)
            setDetectedBoundingBoxes(data.formatted_bboxes)
            console.log("Server response:", data);
          } else {
            console.error("Error from server:", await response.text());
          }
        } catch (error) {
          console.error("Error during image upload:", error);
        }
      };
  
      sendImageToServer();
    }
  }, [imageSrc]);
  

  const highlightRoom = (highlightedRoom) => {
    if (!ctrlPressed) {
      const canvas = canvasRoomsRef?.current;
      const ctx = canvas?.getContext("2d");
      drawLightPolygon(canvas, ctx, highlightedRoom?.coords || []);
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
    };
    const handleKeyUp = (e) => {
      if (
        e.key === "Control" ||
        e.key === "ControlLeft" ||
        e.key === "ControlRight"
      ) {
        setCtrlPressed(false);
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
    if (
      !validFileTypes.includes(fileType) &&
      fileType !== "" &&
      fileType !== null
    ) {
      setFileTypeError(`${fileType} is not supported!`);
    } else {
      setFileTypeError("");
    }
  }, [fileType]);

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
        ctx.lineWidth = 2;
        ctx.strokeStyle = "red";

        if (
          highlightedBox &&
          highlightedBox.x === box.x &&
          highlightedBox.y === box.y &&
          highlightedBox.width === box.width &&
          highlightedBox.height === box.height
        ) {
          ctx.strokeStyle = "purple"; // Highlight the box with a blue color
          ctx.lineWidth = 4; // Make the border thicker
        } else {
          ctx.strokeStyle = "red"; // Default color for other boxes
        }
        ctx.stroke();

        // Optionally, add label to the bounding box
        ctx.fillStyle = "red";
        ctx.fillText(box.label || "", box.x, box.y - 5);
      });

      // Draw the current bounding box while the user is drawing
      if (isDrawing && currentBox) {
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
    }
  }, [
    currentBoundingBoxes,
    detectedBoundingBoxes,
    isDrawing,
    currentBox,
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
    if (!ctrlPressed) return; // Only allow drawing if Ctrl is pressed
    const { offsetX, offsetY } = e.nativeEvent;
    setStartPoint({ x: offsetX, y: offsetY }); // Set the starting point of the box
    setIsDrawing(true); // Indicate that the user is drawing
    setCurrentBox({
      x: offsetX,
      y: offsetY,
      width: 0,
      height: 0,
    }); // Initialize the current box
  };

  // Mouse move event to update the current bounding box while dragging
  const handleMouseMove = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const width = offsetX - startPoint.x;
    const height = offsetY - startPoint.y;
    setTimeout(() => {
      // Check if the mouse is inside any room and highlight the room
      for (const room of roomData) {
        if (isPointInPolygon([offsetX, offsetY], room.coords)) {
          setHighlightedRoom(room); // Set the highlighted room
          highlightRoom(room);
          return;
        }
      }

      // Reset the highlighted room if the mouse is not inside any room
      setHighlightedRoom(null);
      highlightRoom(null);
    }, [1]);

    if (!isDrawing || !ctrlPressed) return; // Only update if the user is drawing

    // Update the current box dimensions
    setCurrentBox({
      x: startPoint.x,
      y: startPoint.y,
      width: width,
      height: height,
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
    if (!isDrawing) return; // Only add the box if drawing is in progress
    // console.log(currentCsvRecords);
    // setCurrentCsvRecords([...currentCsvRecords, currentCsvRecord]);
    setIsDrawing(false); // End drawing
    if (currentBox) {
      const newBox = { ...currentBox, label: "door" };
      setCurrentBoundingBoxes((prevBoxes) => [...prevBoxes, newBox]); // Add new box to the list
      setBoxToLabel(newBox); // Set the box to label
      // setShowModal(true); // Show the modal for labeling
    }
  };

  // Handle right-click event for labeling the bounding box
  const handleRightClick = (e) => {
    e.preventDefault(); // Prevent the default right-click menu
    const { offsetX, offsetY } = e.nativeEvent;
    const clickedPoint = [offsetX, offsetY];

    // Check if the clicked point is inside any room
    for (const room of roomData) {
      if (isPointInPolygon(clickedPoint, room.coords)) {
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

  // Handle the modal Cancel button (delete the bounding box)
  const handleModalCancel = () => {
    setCurrentBoundingBoxes((prevBoxes) =>
      prevBoxes.filter((box) => box !== boxToLabel)
    );
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
  }, [imageIsGrabbed, ctrlPressed]);

  // console.log(roomData);

  return (
    <div style={imageContainer}>
      {imageSrc && (
        <div style={currentRoomContainer}>
          <p style={currentRoom}>
            Current Room: {highlightedRoom ? highlightedRoom.label : "-"}
          </p>
        </div>
      )}
      {!imageSrc && (
        <FileInputComponent
          setFileType={setFileType}
          onChangeMethod={handleImageChange}
        />
      )}
      <p style={errorMessage}>{fileTypeError}</p>
      {/* {!imageSrc && (
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{
            padding: "10px 20px", // Padding for a larger clickable area
            fontSize: "16px", // Easy-to-read font size
            borderRadius: "8px", // Smooth rounded corners
            border: "2px solid #1f575a", // Stylish border with your color
            backgroundColor: "#f4f4f4", // Light background for contrast
            color: "#1f575a", // Match text color with the border
            cursor: "pointer", // Pointer cursor for better affordance
            transition: "all 0.3s ease", // Smooth hover effects
            outline: "none", // Removes the default focus outline
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)", // Subtle shadow for depth
          }}
        />
      )} */}

      {imageSrc && (
        <Rectangle
          style={{
            width: "100%",
            height: "100%",
            display: "flex", // Enables Flexbox
            justifyContent: "center", // Centers content horizontally
            alignItems: "center", // Centers content vertically
            position: "relative", // Ensures the canvas layers align properly
          }}
        >
          <TransformWrapper
            initialScale={1.2}
            initialPositionX={0}
            initialPositionY={0}
            disabled={ctrlPressed}
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
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
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
        <div className="modal">
          <div className="modal-content">
            <h2 style={{ fontSize: "16px", marginBottom: "20px" }}>
              Label the {roomToLabel.label}
            </h2>
            <label>Choose Label:</label>
            <select value={selectedLabel} onChange={handleLabelChange}>
              <option value="">Select a label</option>
              <option value="room">Room</option>
              <option value="door">Door</option>
              <option value="corridor">Corridor</option>
            </select>
            <label>Custom Label (Optional):</label>
            <input
              type="text"
              value={customLabel}
              onChange={handleCustomLabelChange}
              placeholder="Enter custom label"
            />
            <div className="modal-buttons">
              <button className="cancel" onClick={handleModalCancel}>
                Cancel
              </button>
              <button
                disabled={!selectedLabel && !customLabel}
                onClick={handleModalOK}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {imageSrc && (
        <div style={buttonsContainer}>
          {" "}
          <button
            className="cancel"
            onClick={() => {
              setImageSrc(null);
              setCurrentBoundingBoxes([]);
              setDetectedBoundingBoxes([]);
              setCurrentFileName(null);
            }}
          >
            Back
          </button>
          <button onClick={generateCSV}>Download CSV</button>
          <button className="yellow" onClick={generateXML}>
            Download XML
          </button>
        </div>
      )}
    </div>
  );
};

export default FloorPlanImage;
