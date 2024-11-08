// Function to convert image URI to Base64
import * as FileSystem from "expo-file-system";
export const imageToBase64 = async (fileUri) => {
  try {
    // Read the image file as Base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    return ``;
  }
};
