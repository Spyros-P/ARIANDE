import { generateBidFromName } from "./makeBid";

export const createBuildingReqBody = (
  buildingName,
  floorPlanImageID,
  buildingImageID
) => {
  return {
    data: {
      bid: generateBidFromName(buildingName),
      name: buildingName,
      lat: 42.42,
      lon: 17.17,
      graph: {
        Graph: [
          {
            id: 0,
            edges: [1],
            floor: 0,
            label: "Bedroom",
            imageX: 100,
            imageY: 81,
            primary: true,
          },
          {
            id: 1,
            edges: [0],
            floor: 0,
            label: "Bedroom",
            imageX: 55,
            imageY: 141,
            primary: false,
          },
          {
            id: 2,
            edges: [1, 3],
            floor: 0,
            label: "Corridor",
            imageX: 100,
            imageY: 200,
            primary: true,
          },
          {
            id: 3,
            edges: [2, 4],
            floor: 0,
            label: "Corridor",
            imageX: 201,
            imageY: 200,
            primary: false,
          },
          {
            id: 4,
            edges: [3, 5],
            floor: 0,
            label: "Bathroom",
            imageX: 180,
            imageY: 140,
            primary: false,
          },
          {
            id: 5,
            edges: [4],
            floor: 0,
            label: "Bathroom",
            imageX: 209,
            imageY: 91,
            primary: true,
          },
          {
            id: 6,
            edges: [3, 7, 9, 10],
            floor: 0,
            label: "Living Room",
            imageX: 262,
            imageY: 308,
            primary: false,
          },
          {
            id: 7,
            edges: [6, 8],
            floor: 0,
            label: "Kitchen",
            imageX: 298,
            imageY: 241,
            primary: false,
          },
          {
            id: 8,
            edges: [7],
            floor: 0,
            label: "Kitchen",
            imageX: 294,
            imageY: 93,
            primary: true,
          },
          {
            id: 9,
            edges: [6, 10],
            floor: 0,
            label: "Living Room",
            imageX: 337,
            imageY: 360,
            primary: true,
          },
          {
            id: 10,
            edges: [6, 9, 11],
            floor: 0,
            label: "Office",
            imageX: 198,
            imageY: 400,
            primary: false,
          },
          {
            id: 11,
            edges: [10],
            floor: 0,
            label: "Office",
            imageX: 167,
            imageY: 451,
            primary: true,
          },
        ],
        Rooms: [
          {
            floor: 0,
            label: "Bedroom",
            coords: [
              [42, 16],
              [161, 19],
              [160, 135],
              [45, 140],
            ],
          },
          {
            floor: 0,
            label: "Bathroom",
            coords: [
              [163, 19],
              [262, 18],
              [261, 137],
              [162, 137],
            ],
          },
          {
            floor: 0,
            label: "Kitchen",
            coords: [
              [264, 20],
              [423, 20],
              [267, 242],
              [429, 242],
            ],
          },
          {
            floor: 0,
            label: "Office",
            coords: [
              [42, 400],
              [261, 400],
              [263, 500],
              [40, 500],
            ],
          },
          {
            floor: 0,
            label: "Living Room",
            coords: [
              [42, 141],
              [260, 141],
              [260, 243],
              [428, 243],
              [432, 500],
              [264, 500],
              [264, 400],
              [184, 400],
              [184, 250],
              [42, 250],
            ],
          },
        ],
        Floors: 1,
        Distance_Per_Pixel: 1,
      },
      image: buildingImageID,
      floorPlan: floorPlanImageID,
    },
  };
};
