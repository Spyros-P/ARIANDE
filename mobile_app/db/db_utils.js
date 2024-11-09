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
async function dropMyMaps(db) {
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
    // dropMyMaps(db);
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS myMaps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        imageBase64 TEXT NOT NULL,
        lon INTEGER NOT NULL,
        lat INTEGER NOT NULL
      );
        `);
    const allRows = await db.getAllAsync("SELECT * FROM myMaps");
    if (allRows.length === 0) {
      const statement = await db.prepareAsync(
        "INSERT INTO myMaps (name, imageBase64, lon, lat) VALUES ($name, $image, $lon, $lat)"
      );
      await statement.executeAsync({
        $name: "Hospital Kati",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage1)
        )}`,
        $lat: "37.9977728",
        $lon: "23.7345643",
      });
      await statement.executeAsync({
        $name: "Ktirio allo",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage2)
        )}`,
        $lat: "39.0047165",
        $lon: "23.3272946",
      });
      await statement.executeAsync({
        $name: "Ena ktirio kalo",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage3)
        )}`,
        $lat: "56.5940331",
        $lon: "-3.5344667",
      });
      await statement.executeAsync({
        $name: "Ena ktirio megalo",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage4)
        )}`,
        $lat: "-3.5159044",
        $lon: "23.5801791",
      });
      await statement.executeAsync({
        $name: "Ktirio ki auto",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage4)
        )}`,
        $lat: "-3.5159044",
        $lon: "23.5801791",
      });
      await statement.executeAsync({
        $name: "buidling me onoma",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage4)
        )}`,
        $lat: "-3.5159044",
        $lon: "23.5801791",
      });
      await statement.executeAsync({
        $name: "Megaro mousikis",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage4)
        )}`,
        $lat: "-3.5159044",
        $lon: "23.5801791",
      });
      await statement.executeAsync({
        $name: "Stathos trainwn",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage4)
        )}`,
        $lat: "-3.5159044",
        $lon: "23.5801791",
      });
      await statement.executeAsync({
        $name: "Stathmos lewforeiwn",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage4)
        )}`,
        $lat: "-3.5159044",
        $lon: "23.5801791",
      });
      await statement.executeAsync({
        $name: "Akona ena ktirio",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage4)
        )}`,
        $lat: "-3.5159044",
        $lon: "23.5801791",
      });
      await statement.executeAsync({
        $name: "Ki auto ktirio",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage4)
        )}`,
        $lat: "-3.5159044",
        $lon: "23.5801791",
      });
      await statement.executeAsync({
        $name: "Stathmos allos",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage4)
        )}`,
        $lat: "-3.5159044",
        $lon: "23.5801791",
      });
      await statement.executeAsync({
        $name: "Enas akomi titlos",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage4)
        )}`,
        $lat: "-3.5159044",
        $lon: "23.5801791",
      });
      await statement.executeAsync({
        $name: "Hello there",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage4)
        )}`,
        $lat: "-3.5159044",
        $lon: "23.5801791",
      });
      await statement.executeAsync({
        $name: "Goodmorning",
        $image: `${await imageToBase64(
          await computeURIOfLocalImageAsset(locationImage4)
        )}`,
        $lat: "-3.5159044",
        $lon: "23.5801791",
      });
    }
  } catch (error) {
    console.log("ERROR when trying to initialize the DB");
  }
}
