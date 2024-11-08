export async function fetchMyMaps(db) {
  try {
    const res = await db.getAllAsync("SELECT * FROM myMaps");
    return res;
  } catch (error) {
    console.log("Error fetching maps:", error);
    return [];
  }
}
