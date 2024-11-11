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
        if (
          buildingInfo?.image?.formats?.small?.url ||
          buildingInfo?.image?.formats?.thumbnail?.url
        ) {
          const base64 = buildingInfo?.image?.formats?.small?.url
            ? await convertPublicImageToBase64(
                buildingInfo.image.formats.small.url
              )
            : await convertPublicImageToBase64(
                buildingInfo.image.formats.thumbnail.url
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
        }
        return {};
      })
    );
  } catch (error) {
    throw error;
  }
};
