import axios from "axios";
import { STRAPI_URL, STRAPI_READ_ONLY_TOKEN } from "@env";
import { convertPublicImageToBase64 } from "../utils/imageToBase64";

const headers = {
  headers: { Authorization: `Bearer ${STRAPI_READ_ONLY_TOKEN}` },
};

export const fetchDownloadableBuildings = async () => {
  try {
    const res = await axios.get(
      STRAPI_URL + "/api/buildings?populate=*",
      headers
    );
    return await Promise.all(
      res.data.data.map(async (buildingInfo) => {
        const base64 = await convertPublicImageToBase64(
          `${STRAPI_URL + buildingInfo.image.url}`
        );
        return {
          id: buildingInfo.id,
          name: buildingInfo.name,
          lat: buildingInfo.lat,
          lon: buildingInfo.lon,
          imageBase64: base64,
          downloading: false,
          alreadySaved: false,
          downloaded: false,
        };
      })
    );
  } catch (error) {
    throw error;
  }
};
