export async function fetchMyMaps(db) {
  try {
    const res = await db.getAllAsync("SELECT * FROM myMaps");
    return res.map((map) => {
      return { ...map, alreadySaved: true };
    });
  } catch (error) {
    console.log("Error fetching maps:", error);
    return [];
  }
}

export async function fetchFloorPlanByID(db, CardId) {
  try {
    const res = await db.getFirstAsync(
      "SELECT floorPlanBase64, floorPlanWidth, floorPlanHeight, graph FROM myMaps WHERE id=?",
      CardId
    );
    return res;
  } catch (error) {
    console.log("Error when trying to delete card:", error);
    return error.message;
  }
}

export async function deleteCardById(db, CardId) {
  try {
    const res = await db.runAsync("DELETE FROM myMaps WHERE id=?", CardId);
    return res;
  } catch (error) {
    console.log("Error when trying to delete card:", error);
    return error.message;
  }
}

export async function downloadNewBuilding(
  db,
  id,
  name,
  image,
  floorPlan,
  floorPlanWidth,
  floorPlanHeight,
  graph,
  lat,
  lon
) {
  try {
    console.log(graph);
    const statement = await db.prepareAsync(
      "INSERT INTO myMaps (id, name, imageBase64, floorPlanBase64,floorPlanWidth, floorPlanHeight, graph, lon, lat) VALUES ($id, $name, $image, $floorPlan,$floorPlanWidth, $floorPlanHeight, $graph ,$lon, $lat)"
    );
    const res = await statement.executeAsync({
      $id: id,
      $name: name,
      $image: image,
      $floorPlan: floorPlan,
      $floorPlanWidth: floorPlanWidth,
      $floorPlanHeight: floorPlanHeight,
      $graph: JSON.stringify(graph),
      $lat: lat,
      $lon: lon,
    });
    return res;
  } catch (error) {
    throw new Error(error.message);
  }
}
