export async function fetchMyMaps(db) {
  try {
    const res = await db.getAllAsync("SELECT * FROM myMaps");
    return res;
  } catch (error) {
    console.log("Error fetching maps:", error);
    return [];
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
