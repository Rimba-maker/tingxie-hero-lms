const MAX_SIZE_BYTES = 10_000_000;

// The only formats a real capture path can produce (canvas.toBlob's fixed
// "image/jpeg", or whatever raster format ImageCapture.takePhoto() picks on
// the device - not guaranteed to be JPEG, confirmed via MDN, hence more than
// one entry here). Deliberately not a blanket startsWith("image/") check:
// this Content-Type is stored and served back verbatim from a public
// Storage URL (9a94c9e), and image/svg+xml starts with "image/" too while
// being able to carry an embedded <script>.
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Called at the /api/upload trust boundary before anything touches Storage or
// Gemini — an oversized or non-image blob should fail fast with a clear
// message, not surface as an opaque Storage or Gemini error downstream.
export function validateWorksheetImage(file: { type: string; size: number }): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "File must be a JPEG, PNG, or WebP image";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "Image must be smaller than 10MB";
  }
  return null;
}
