const MAX_SIZE_BYTES = 10_000_000;

// Called at the /api/upload trust boundary before anything touches Storage or
// Gemini — an oversized or non-image blob should fail fast with a clear
// message, not surface as an opaque Storage or Gemini error downstream.
export function validateWorksheetImage(file: { type: string; size: number }): string | null {
  if (!file.type.startsWith("image/")) {
    return "File must be an image";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "Image must be smaller than 10MB";
  }
  return null;
}
