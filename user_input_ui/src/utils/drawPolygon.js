/**
 * Draws a polygon with a light color fill on a canvas, clearing all previous drawings.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {Array} coordinates - Array of [x, y] pairs representing the vertices of the polygon.
 * @param {String} fillColor - The fill color of the polygon, default is light blue with transparency.
 * @param {String} borderColor - The border color of the polygon, default is gray.
 */
export function drawLightPolygon(
  canvas,
  ctx,
  coordinates,
  fillColor = "rgba(173, 216, 230, 0.5)",
  borderColor = "gray"
) {
  if (coordinates.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  if (coordinates.length < 3) {
    console.error("Polygon must have at least 3 vertices.");
    return;
  }

  // Clear the entire canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Begin the path
  ctx.beginPath();
  ctx.moveTo(coordinates[0][0], coordinates[0][1]); // Move to the first vertex

  // Draw lines to each subsequent vertex
  coordinates.forEach(([x, y]) => {
    ctx.lineTo(x, y);
  });

  // Close the path to form the polygon
  ctx.closePath();

  // Fill the polygon with the light color
  ctx.fillStyle = fillColor;
  ctx.fill();

  // Optionally draw the border
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();
}
