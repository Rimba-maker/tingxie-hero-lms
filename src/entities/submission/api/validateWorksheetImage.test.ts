import { describe, expect, test } from "vitest";

import { validateWorksheetImage } from "./validateWorksheetImage";

describe("validateWorksheetImage", () => {
  test("accepts a normal-sized JPEG", () => {
    expect(validateWorksheetImage({ type: "image/jpeg", size: 2_000_000 })).toBeNull();
  });

  test("rejects a non-image file", () => {
    expect(validateWorksheetImage({ type: "application/pdf", size: 1000 })).toBe(
      "File must be a JPEG, PNG, or WebP image",
    );
  });

  test("rejects an image/* type outside the raster allowlist", () => {
    // Downstream, this Content-Type gets stored and served back verbatim
    // from a public Storage URL (9a94c9e) - image/svg+xml starts with
    // "image/" but can carry embedded <script>, so a blanket
    // startsWith("image/") check isn't actually the safety boundary it
    // looks like. Only the raster formats a real capture path can produce.
    expect(validateWorksheetImage({ type: "image/svg+xml", size: 1000 })).toBe(
      "File must be a JPEG, PNG, or WebP image",
    );
  });

  test("rejects a file over the 10MB limit", () => {
    expect(validateWorksheetImage({ type: "image/jpeg", size: 11_000_000 })).toBe(
      "Image must be smaller than 10MB",
    );
  });

  test("accepts a file exactly at the 10MB limit", () => {
    expect(validateWorksheetImage({ type: "image/png", size: 10_000_000 })).toBeNull();
  });
});
