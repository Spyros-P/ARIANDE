// Convert base64 string to Blob
export const base64ToBlob = (base64, contentType = "") => {
  const byteCharacters = atob(base64.split(",")[1]); // Remove the `data:*/*;base64,` prefix
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length)
      .fill(0)
      .map((_, i) => slice.charCodeAt(i));
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};
