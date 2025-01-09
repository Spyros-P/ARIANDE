import React from "react";

const Modal = ({
  title,
  forRooms,
  handleCancel,
  handleSubmit,
  disabledOK,
  inputValue,
  handleInputValue,
  forDistancePerPixel,
}) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2 style={{ fontSize: "16px", marginBottom: "20px" }}>{title}</h2>
        {forRooms && (
          <>
            <label>Your Label</label>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputValue}
              placeholder="Enter custom label"
            />
          </>
        )}{" "}
        {forDistancePerPixel && (
          <>
            <label>Distance</label>
            <input
              type="number"
              step={0.001}
              value={inputValue}
              onChange={handleInputValue}
              placeholder="Enter distance"
            />
          </>
        )}
        <div className="modal-buttons">
          <button className="cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button disabled={disabledOK} onClick={handleSubmit}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
