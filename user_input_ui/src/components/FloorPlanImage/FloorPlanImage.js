import styled from "styled-components";

// Styled Component for the Rectangle
export const Rectangle = styled.div`
  border-radius: 10px; // Rounded corners
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); // Soft shadow
  overflow: hidden; // Prevent image overflow
  position: relative; // Allow the TransformComponent to take full space
  background-color: #d2d8d8; // Light background color
`;

export const ImageContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden; // Hide any part of image that goes out of bounds
`;

export const currentRoom = { color: "rgb(31, 87, 90)" };

export const currentRoomContainer = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  backgroundColor: "rgb(216, 248, 243)",
};

export const buttonsContainer = {
  display: "flex",
  flexDirection: "row",
  gap: 10,
};

export const imageContainer = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

export const errorMessage = {
  color: "red",
};
