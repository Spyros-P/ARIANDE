export const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center", // Center cards horizontally
  gap: "12px", // Spacing between cards
  padding: "20px",
  maxHeight: "600px", // Restrict height to make it scrollable
  overflowY: "auto", // Enable vertical scrolling
  backgroundColor: "#b7cecc", // Light green background
  borderRadius: "12px", // Rounded corners for the container
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // Subtle shadow
  width: "fit-content",
  minWidth: "320px",
  maxWidth: "30%", // Fixed width for the card list
  margin: "0 auto", // Center the card list horizontally on the page
};

export const listTitleStyle = {
  fontSize: "22px", // Comfortable font size
  fontWeight: "bold",
  color: "#333", // Neutral dark gray
  lineHeight: "1.6", // Spacing between lines for readability
  margin: "8px 0", // Balanced spacing
  padding: "0", // No unnecessary padding
  textAlign: "left", // Align text to the left
  wordWrap: "break-word", // Prevent long text overflow
};
