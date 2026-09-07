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
      contentType: "image/jpeg",
    });

    expect(result).toEqual({
      imageUrl: "https://example.supabase.co/storage/v1/object/public/worksheet-photos/abc123.jpg",
    });
  });

  test("passes the validated content type through to storage, not a hardcoded one", async () => {
    // A real ImageCapture.takePhoto() capture isn't guaranteed to be JPEG
    // (confirmed via MDN) - storing it under a mismatched Content-Type would
    // later tell Gemini the wrong format for the same bytes.
    let uploadedContentType: string | undefined;
    const fakeStorage: WorksheetImageStorage = {
      upload: async (_path, _file, contentType) => {
        uploadedContentType = contentType;
        return { publicUrl: "https://example.com/x.png" };
      },
    };

    await uploadWorksheetImage(fakeStorage, {
      file: new Blob(["fake-image-bytes"]),
      path: "abc123.png",
      contentType: "image/png",
    });

    expect(uploadedContentType).toBe("image/png");
  });
});
