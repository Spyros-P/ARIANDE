export function generateBidFromName(name) {
  if (!name || typeof name !== "string") {
    throw new Error("Invalid name provided. Name must be a non-empty string.");
  }

  // Normalize the name (e.g., remove accents, convert to lowercase)
  const normalized = name
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .toLowerCase();

  // Remove non-alphanumeric characters (except hyphens and spaces)
  const sanitized = normalized.replace(/[^a-z0-9\s-]/g, "");

  // Replace spaces with hyphens
  const hyphenated = sanitized.replace(/\s+/g, "-");

  // Generate a unique identifier (e.g., timestamp or random string)
  const uniqueId = Date.now().toString(36); // Base-36 timestamp for brevity

  // Combine hyphenated name with the unique identifier
  return `${hyphenated}-${uniqueId}`;
}
