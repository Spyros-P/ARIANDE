export function computeLabels(rooms) {
  let labels = new Set();
  rooms.forEach((room) => room.label !== "Corridor" && labels.add(room.label));
  return Array.from(labels);
}

export function computePrimaryNodeForDestination(location, graph) {
  let destinationNode = -1;
  graph.forEach((node) => {
    if (node.primary && node.label === location)
      destinationNode = node.id.toString();
  });
  return destinationNode;
}

function pixelDistance(pixel1, pixel2) {
  return (
    (pixel1.x - pixel2.x) * (pixel1.x - pixel2.x) +
    (pixel1.y - pixel2.y) * (pixel1.y - pixel2.y)
  );
}

export function nearestNodeFromCurrentLocation(currentLocation, graph) {
  let nearestNode = "";
  let nearestNodeDistance = Infinity;
  let nearestNodeCoords = { x: 0, y: 0 };
  graph.forEach((node) => {
    let dis = pixelDistance(currentLocation, {
      x: node.imageX,
      y: node.imageY,
    });
    if (nearestNodeDistance > dis) {
      nearestNodeDistance = dis;
      nearestNodeCoords.x = node.imageX;
      nearestNodeCoords.y = node.imageY;
      nearestNode = node.id.toString();
    }
  });
  return { nearestNode, nearestNodeDistance, nearestNodeCoords };
}

export function pixelsFromNodeID(id, graph) {
  let pixels = { x: 0, y: 0 };
  graph.forEach((node) => {
    if (node.id.toString() === id) {
      pixels.x = node.imageX;
      pixels.y = node.imageY;
    }
  });
  return pixels;
}
