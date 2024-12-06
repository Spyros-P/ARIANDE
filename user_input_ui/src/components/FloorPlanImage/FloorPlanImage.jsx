import React, { useState, useRef, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ImageContainer, Rectangle } from "./FloorPlanImage";

const FloorPlanImage = ({
  imageSrc,
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

  const [showModal, setShowModal] = useState(false); // Whether to show the modal
  const [selectedLabel, setSelectedLabel] = useState(""); // Selected label from the dropdown
  const [customLabel, setCustomLabel] = useState(""); // Custom label text
  const [boxToLabel, setBoxToLabel] = useState(null); // The bounding box that needs labeling

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  console.log(highlightedBox);
  // Listen for key events to detect when the Ctrl key is pressed
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

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Draw bounding boxes and the current box being drawn
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const image = imageRef.current;

    if (image && canvas) {
      canvas.width = image.width;
      canvas.height = image.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before re-drawing
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
    if (!isDrawing || !ctrlPressed) return; // Only update if the user is drawing
    const { offsetX, offsetY } = e.nativeEvent;
    const width = offsetX - startPoint.x;
    const height = offsetY - startPoint.y;

    // Update the current box dimensions
    setCurrentBox({
      x: startPoint.x,
      y: startPoint.y,
      width: width,
      height: height,
    });
  };

  // Mouse up event to finalize the bounding box and trigger the modal
  const handleMouseUp = () => {
    if (!isDrawing) return; // Only add the box if drawing is in progress

    setIsDrawing(false); // End drawing
    if (currentBox) {
      const newBox = { ...currentBox, label: "uknown" };
      setCurrentBoundingBoxes((prevBoxes) => [...prevBoxes, newBox]); // Add new box to the list
      setBoxToLabel(newBox); // Set the box to label
      setShowModal(true); // Show the modal for labeling
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
        const updatedBoxes = currentBoundingBoxes.map((box) =>
          box === boxToLabel ? { ...box, label: labelToUse } : box
        );
        setCurrentBoundingBoxes(updatedBoxes);
      }
      setShowModal(false);
      setSelectedLabel("");
      setCustomLabel("");
    }
  };

  // Handle the modal Cancel button (delete the bounding box)
  const handleModalCancel = () => {
    setCurrentBoundingBoxes((prevBoxes) =>
      prevBoxes.filter((box) => box !== boxToLabel)
    );
    setShowModal(false);
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

  return (
    <>
      <Rectangle
        onMouseDown={grabImage}
        onMouseUp={leaveImage}
        style={{ cursor: imageCursor }}
      >
        {/* Zoom and Pan functionality */}
        <TransformWrapper
          initialScale={1}
          initialPositionX={0}
          initialPositionY={0}
          disabled={ctrlPressed} // Disable pan and zoom when Ctrl is pressed
        >
          <ImageContainer
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <TransformComponent>
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Panable and Zoomable"
                style={{
                  width: "100%", // Ensure image scales to fit the container
                  height: "auto", // Maintain aspect ratio
                  objectFit: "contain", // Ensures the image stays inside the box
                }}
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  pointerEvents: "none", // Make canvas non-interactive except for the image
                }}
              />
            </TransformComponent>
          </ImageContainer>
        </TransformWrapper>
      </Rectangle>

      {/* Modal for labeling the bounding box */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2 style={{ fontSize: "16px", marginBottom: "20px" }}>
              Label the Bounding Box
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
    </>
  );
};

export default FloorPlanImage;
