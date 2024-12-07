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
        console.log(buildingInfo?.floorPlan);
        if (
          (buildingInfo?.image?.formats?.small?.url ||
            buildingInfo?.image?.formats?.thumbnail?.url) &&
          buildingInfo?.floorPlan?.url
        ) {
          const buildingImageBase64 = buildingInfo?.image?.formats?.small?.url
            ? await convertPublicImageToBase64(
                buildingInfo.image.formats.small.url
              )
            : await convertPublicImageToBase64(
                buildingInfo.image.formats.thumbnail.url
              );
          const floorPlanImageBase64 = await convertPublicImageToBase64(
            buildingInfo?.floorPlan?.url
          );
          return {
            id: buildingInfo.id,
            name: buildingInfo.name,
            lat: buildingInfo.lat,
            lon: buildingInfo.lon,
            imageBase64: buildingImageBase64,
            floorPlanBase64: floorPlanImageBase64,
            floorPlanWidth: buildingInfo.floorPlan.width,
            floorPlanHeight: buildingInfo.floorPlan.height,
            graph: buildingInfo.graph,
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
