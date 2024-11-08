import { imageToBase64 } from "../utils/imageToBase64";
import locationImage1 from "../assets/myMapsImages/Pic holder.png";
import locationImage2 from "../assets/myMapsImages/otherBuilding.jpeg";
import locationImage3 from "../assets/myMapsImages/otherBuilding2.jpg";
import locationImage4 from "../assets/myMapsImages/otherBuilding3.jpg";
import { Asset } from "expo-asset";

// compute the file path of the local dummy images (assets)
async function computeURIOfLocalImageAsset(image) {
  const asset = Asset.fromModule(image);
  await asset.downloadAsync();
  return asset.localUri || asset.uri;
}

// for testing purpose
export async function dropMyMaps(db) {
  try {
    await db.runAsync(`
    DROP TABLE IF EXISTS myMaps;
      `);
  } catch (error) {
    console.log("ERROR when trying to delete the table myMaps");
  }
}

// make the table containing my buildings and initialize it using dummy data
export async function initializeDB(db) {
  try {
    //dropMyMaps(db);
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS myMaps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        imageBase64 TEXT
      );
        `);
    const allRows = await db.getAllAsync("SELECT * FROM myMaps");
    if (allRows.length === 0) {
      const statement = await db.prepareAsync(
        "INSERT INTO myMaps (name, imageBase64) VALUES ($name, $image)"
      );
      await statement.executeAsync({
        $name: "Building1",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage1)
        )}`,
      });
      await statement.executeAsync({
        $name: "Building2",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage2)
        )}`,
      });
      await statement.executeAsync({
        $name: "Building3",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage3)
        )}`,
      });
      await statement.executeAsync({
        $name: "Building4",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage4)
        )}`,
      });
    }
  } catch (error) {
    console.log("ERROR when trying to initialize the DB");
  }
}
