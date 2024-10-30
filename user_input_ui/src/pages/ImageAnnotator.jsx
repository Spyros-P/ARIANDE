import React, { useEffect, useRef, useState } from 'react';

const ImageLabelingTool = () => {
  const [imageSrc, setImageSrc] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [transformOrigin, setTransformOrigin] = useState({ x: 50, y: 50 });
  const [transoffset, setTransoffset] = useState({ x: 0, y: 0 });
  const [boxes, setBoxes] = useState([]);
  const [pointCount, setPointCount] = useState(0);
  const [start, setStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  
  useEffect(() => {
    // Automatically load the first image
    fetchNextImage();

    // Mouse wheel zooming
    const handleWheel = (event) => {
      event.preventDefault();
      const rect = imageRef.current.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;

      const arrowX = (offsetX / rect.width) * 100;
      const arrowY = (offsetY / rect.height) * 100;

      let newZoomLevel = zoomLevel + event.deltaY * -0.002;
      newZoomLevel = Math.min(Math.max(1, newZoomLevel), 8);

      if (newZoomLevel !== zoomLevel) {
        const newTransoffsetX = calculateTransoffset(
          arrowX,
          arrowY,
          newZoomLevel,
          'x'
        );
        const newTransoffsetY = calculateTransoffset(
          arrowX,
          arrowY,
          newZoomLevel,
          'y'
        );

        setTransoffset({ x: newTransoffsetX, y: newTransoffsetY });
        setTransformOrigin({ x: arrowX, y: arrowY });
        setZoomLevel(newZoomLevel);

        redrawBoundingBoxes();
      }
    };

    // Keydown event to reset point count
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPointCount(0);
        setBoxes([]);
        redrawBoundingBoxes();
      }
    };

    // Mouse move event for drawing bounding boxes
    const handleMouseMove = (event) => {
      redrawBoundingBoxes();
      if (pointCount === 1) {
        const rect = imageRef.current.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;

        const arrowX = (offsetX / rect.width) * 100;
        const arrowY = (offsetY / rect.height) * 100;

        const topLeftX = Math.min(start.x, arrowX);
        const topLeftY = Math.min(start.y, arrowY);
        const bottomRightX = Math.max(start.x, arrowX);
        const bottomRightY = Math.max(start.y, arrowY);

        drawBoundingBox(topLeftX, topLeftY, bottomRightX, bottomRightY);
      }
    };

    // Right-click event for bounding box selection
    const handleContextMenu = (event) => {
      event.preventDefault();
      const rect = imageRef.current.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;

      const arrowX = (offsetX / rect.width) * 100;
      const arrowY = (offsetY / rect.height) * 100;

      if (pointCount === 0) {
        setStart({ x: arrowX, y: arrowY });
        setPointCount(1);
      } else if (pointCount === 1) {
        const topLeftX = Math.min(start.x, arrowX);
        const topLeftY = Math.min(start.y, arrowY);
        const bottomRightX = Math.max(start.x, arrowX);
        const bottomRightY = Math.max(start.y, arrowY);

        setBoxes((prevBoxes) => [
          ...prevBoxes,
          { x1: topLeftX, y1: topLeftY, x2: bottomRightX, y2: bottomRightY },
        ]);
        drawBoundingBox(topLeftX, topLeftY, bottomRightX, bottomRightY);
        setPointCount(0);
      }
    };

    // Adding event listeners
    const image = imageRef.current;
    image.addEventListener('wheel', handleWheel);
    image.addEventListener('mousemove', handleMouseMove);
    image.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      image.removeEventListener('wheel', handleWheel);
      image.removeEventListener('mousemove', handleMouseMove);
      image.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomLevel, pointCount, start]);

  const fetchNextImage = async () => {
    try {
      const response = await fetch('/next_image');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageSrc(url);
      resetState();
    } catch (error) {
      console.error('Error fetching next image:', error);
    }
  };

  const fetchPreviousImage = async () => {
    try {
      const response = await fetch('/prev_image');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setImageSrc(url);
      resetState();
    } catch (error) {
      console.error('Error fetching previous image:', error);
    }
  };

  const resetState = () => {
    setBoxes([]);
    setTransformOrigin({ x: 50, y: 50 });
    setTransoffset({ x: 0, y: 0 });
    setZoomLevel(1);
    redrawBoundingBoxes();
  };

  const calculateTransoffset = (arrowX, arrowY, newZoomLevel, axis) => {
    const offset = axis === 'x' ? transoffset.x : transoffset.y;
    return (
      -transformOrigin.x * (1 - 1 / zoomLevel) +
      arrowX * (1 - 1 / newZoomLevel) +
      offset * (1 / newZoomLevel - 1 / zoomLevel)
    );
  };

  const drawBoundingBox = (x1, y1, x2, y2) => {
    const ctx = canvasRef.current.getContext('2d');
    const leftTopX = transformOrigin.x * (1 - 1 / zoomLevel) - transoffset.x;
    const leftTopY = transformOrigin.y * (1 - 1 / zoomLevel) - transoffset.y;

    const posX1 = (x1 - leftTopX) * zoomLevel * (canvasRef.current.width / 100);
    const posY1 = (y1 - leftTopY) * zoomLevel * (canvasRef.current.height / 100);
    const posX2 = (x2 - leftTopX) * zoomLevel * (canvasRef.current.width / 100);
    const posY2 = (y2 - leftTopY) * zoomLevel * (canvasRef.current.height / 100);

    ctx.beginPath();
    ctx.moveTo(posX1, posY1);
    ctx.lineTo(posX2, posY1);
    ctx.lineTo(posX2, posY2);
    ctx.lineTo(posX1, posY2);
    ctx.closePath();
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const redrawBoundingBoxes = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    boxes.forEach((box) => {
      drawBoundingBox(box.x1, box.y1, box.x2, box.y2);
    });
  };

  return (
    <div style={styles.container} ref={containerRef}>
      <div style={styles.imageContainer}>
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Labeling"
          style={{
            ...styles.image,
            transformOrigin: `${transformOrigin.x}% ${transformOrigin.y}%`,
            transform: `scale(${zoomLevel}) translate(${transoffset.x}%, ${transoffset.y}%)`,
          }}
          draggable="false"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={640}
          style={styles.canvas}
        />
      </div>
      <div style={styles.buttonContainer}>
        <button style={styles.button} onClick={fetchPreviousImage}>
          Previous
        </button>
        <button style={styles.button} onClick={fetchNextImage}>
          Next
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    marginTop: '50px',
    position: 'relative',
  },
  imageContainer: {
    width: '640px',
    height: '640px',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    userSelect: 'none',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  buttonContainer: {
    marginTop: '20px',
  },
  button: {
    margin: '0 10px',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
  },
};

export default ImageLabelingTool;
