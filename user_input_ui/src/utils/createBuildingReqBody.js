import { generateBidFromName } from "./makeBid";

export const createBuildingReqBody = (
  buildingName,
  floorPlanImageID,
  buildingImageID,
  lat,
  lon,
  graph
) => {
  return {
    data: {
      bid: generateBidFromName(buildingName),
      name: buildingName,
      lat: lat,
      lon: lon,
      graph,
      image: buildingImageID,
      floorPlan: floorPlanImageID,
      owner: "",
    },
  };
};
