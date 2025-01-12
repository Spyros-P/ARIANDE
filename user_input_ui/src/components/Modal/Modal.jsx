import React from "react";
import { Button, TextField, CircularProgress } from "@mui/material";

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
      <div className="modal-container">
        <div className="modal-content">
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#333",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            {title}
          </h2>

          {forRooms && (
            <>
              <label
                style={{
                  fontSize: "14px",
                  color: "#555",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Add Label
              </label>
              <TextField
                variant="outlined"
                fullWidth
                value={inputValue}
                onChange={handleInputValue}
                placeholder="Enter custom label"
                style={{
                  marginBottom: "20px",
                  borderRadius: "10px",
                  backgroundColor: "#f4f4f4",
                }}
              />
            </>
          )}

          {forDistancePerPixel && (
            <>
              <label
                style={{
                  fontSize: "14px",
                  color: "#555",
                  marginBottom: "8px",
                  display: "block",
                }}
              >
                Distance
              </label>
              <TextField
                variant="outlined"
                fullWidth
                type="number"
                step={0.001}
                value={inputValue}
                onChange={handleInputValue}
                placeholder="Enter distance"
                style={{
                  marginBottom: "20px",
                  borderRadius: "10px",
                  backgroundColor: "#f4f4f4",
                }}
              />
            </>
          )}

          <div
            className="modal-buttons"
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <Button
              variant="outlined"
              onClick={handleCancel}
              style={{
                padding: "8px 20px",
                borderRadius: "25px",
                color: "rgb(218, 191, 191)",
                borderColor: "#f44336",
                fontWeight: "500",
                textTransform: "none",
                transition: "all 0.3s ease",
              }}
              className="cancel"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={disabledOK}
              style={{
                padding: "8px 20px",
                borderRadius: "25px",
                backgroundColor: disabledOK ? "#ccc" : "#4caf50",
                color: "#fff",
                fontWeight: "500",
                textTransform: "none",
                transition: "all 0.3s ease",
                cursor: disabledOK ? "not-allowed" : "pointer",
              }}
              className="ok-button"
            >
              {disabledOK ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "OK"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
