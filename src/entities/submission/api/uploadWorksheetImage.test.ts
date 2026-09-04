import { describe, expect, test } from "vitest";

import { uploadWorksheetImage, type WorksheetImageStorage } from "./uploadWorksheetImage";

describe("uploadWorksheetImage", () => {
  test("uploads the file and returns its public URL", async () => {
    const fakeStorage: WorksheetImageStorage = {
      upload: async () => ({
        publicUrl: "https://example.supabase.co/storage/v1/object/public/worksheet-photos/abc123.jpg",
      }),
    };

    const result = await uploadWorksheetImage(fakeStorage, {
      file: new Blob(["fake-image-bytes"]),
      path: "abc123.jpg",
    });

    expect(result).toEqual({
      imageUrl: "https://example.supabase.co/storage/v1/object/public/worksheet-photos/abc123.jpg",
    });
  });
});
