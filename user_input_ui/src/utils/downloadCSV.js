import Papa from "papaparse";

export const generateAndDownloadCSV = (
  currentBoundingBoxes,
  detectedBoundingBoxes,
  currentFileName,
  imageDimensions
) => {
  console.log(currentBoundingBoxes);
  const csvData = currentBoundingBoxes
    .concat(detectedBoundingBoxes)
    .map((box) => ({
      filename: currentFileName,
      width: imageDimensions.width,
      height: imageDimensions.height,
      class: "door",
      xmin: box.x,
      ymin: box.y,
      xmax: box.x + box.width,
      ymax: box.y + box.height,
    }));
  // Convert data to CSV using PapaParse
  const csv = Papa.unparse(csvData);

  // Create a Blob from the CSV string
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  // Create a link element
  const link = document.createElement("a");

  // Set the download attribute with the file name
  link.download = `${currentFileName.split(".")[0]}.csv`;

  // Create an object URL for the Blob and set it as the href
  link.href = URL.createObjectURL(blob);

  // Append the link to the document body
  document.body.appendChild(link);

  // Programmatically trigger a click event to download the file
  link.click();

  // Clean up by removing the link element
  document.body.removeChild(link);
};
