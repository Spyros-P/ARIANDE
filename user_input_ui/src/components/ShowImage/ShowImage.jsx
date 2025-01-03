import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTimes } from "@fortawesome/free-solid-svg-icons";

function ImageDisplay({ imageSrc, onCancel, onDownload }) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <img
        src={imageSrc}
        alt="Uploaded"
        style={{ width: "300px", height: "auto", borderRadius: "8px" }}
      />
      {/* Cancel Button with FontAwesome Icon */}
      <button
        onClick={onCancel}
        style={{
          position: "absolute",
          top: "0",
          right: "0",
          color: "red",
          border: "none",
          borderRadius: "50%",
          width: "30px",
          height: "30px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "none",
          margin: 5,
          transform: "scale(1.2)",
        }}
      >
        <FontAwesomeIcon icon={faTimes} style={{ fontSize: "18px" }} />
      </button>
      {/* Download Button */}
      <button
        class="download-image"
        onClick={onDownload}
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          color: "rgb(64, 146, 137)",
          border: "none",
          borderRadius: "5px",
          padding: "10px 10px",
          margin: 5,
        }}
      >
        <FontAwesomeIcon icon={faDownload} />
      </button>
    </div>
  );
}

export default ImageDisplay;
