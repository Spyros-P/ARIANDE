import styled from "styled-components";

// Styled Component for the Rectangle
export const Rectangle = styled.div`
  width: 800px; // Fixed width
  height: 600px; // Fixed height
  border: 3px solid #ddd; // Border color
  border-radius: 10px; // Rounded corners
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); // Soft shadow
  overflow: hidden; // Prevent image overflow
  position: relative; // Allow the TransformComponent to take full space
  background-color: #f9f9f9; // Light background color
`;

export const ImageContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden; // Hide any part of image that goes out of bounds
`;
