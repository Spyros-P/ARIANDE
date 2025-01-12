import { Buffer } from "buffer";

export async function convertPublicImageToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    return;
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64String = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = response.headers.get("content-type");
  const base64DataUrl = `data:${mimeType};base64,${base64String}`;
  return base64DataUrl; // or `return base64DataUrl` if you need the full Data URL
}
