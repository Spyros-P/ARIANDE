// Function to convert image URI to Base64
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import { DEFAULT_BUILDING } from "../assets/defaultBuildingBase64";
export const localImageToBase64 = async (fileUri) => {
  try {
    // Read the image file as Base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    throw error;
  }
};

export async function convertPublicImageToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    return DEFAULT_BUILDING;
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64String = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = response.headers.get("content-type");
  const base64DataUrl = `data:${mimeType};base64,${base64String}`;
  return base64DataUrl; // or `return base64DataUrl` if you need the full Data URL
}
