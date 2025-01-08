export const generateAndDownloadXML = (
  currentBoundingBoxes,
  detectedBoundingBoxes,
  imageDimensions,
  currentFileName
) => {
  console.log(currentFileName);
  const xmlData = currentBoundingBoxes
    .concat(detectedBoundingBoxes)
    .map((box) => {
      const xmin = box.x;
      const ymin = box.y;
      const xmax = box.x + box.width;
      const ymax = box.y + box.height;

      return `
      <object>
          <name>door</name>
          <pose>Unspecified</pose>
          <truncated>0</truncated>
          <difficult>0</difficult>
          <occluded>0</occluded>
          <bndbox>
              <xmin>${xmin}</xmin>
              <xmax>${xmax}</xmax>
              <ymin>${ymin}</ymin>
              <ymax>${ymax}</ymax>
          </bndbox>
      </object>\n`;
    })
    .join("");

  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  const annotationStart = `<annotation>\n`;
  const annotationEnd = `</annotation>\n`;

  const sizeBlock = `
      <size>
          <width>${imageDimensions.width}</width>
          <height>${imageDimensions.height}</height>
          <depth>3</depth>
      </size>\n`;

  const sourceBlock = `
      <source>
          <database>Unspecified</database>
      </source>\n`;

  const filenameBlock = `
      <folder></folder>
      <filename>${currentFileName}</filename>
      <path>${currentFileName}</path>\n`;

  const segmentedBlock = `
      <segmented>0</segmented>\n`;

  const fullXML =
    xmlHeader +
    annotationStart +
    filenameBlock +
    sourceBlock +
    sizeBlock +
    segmentedBlock +
    xmlData +
    annotationEnd;
  console.log(fullXML);
  const blob = new Blob([fullXML], { type: "application/xml;charset=utf-8;" });

  // Create a link element
  const link = document.createElement("a");

  // Set the download attribute with the file name
  link.download = `${currentFileName.split(".")[0]}.xml`;

  // Create an object URL for the Blob and set it as the href
  link.href = URL.createObjectURL(blob);

  // Append the link to the document body
  document.body.appendChild(link);

  // Programmatically trigger a click event to download the file
  link.click();

  // Clean up by removing the link element
  document.body.removeChild(link);
};
