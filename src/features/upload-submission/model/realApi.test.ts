import { afterEach, describe, expect, test, vi } from "vitest";

import { realApi } from "./useUploadSubmission";

describe("realApi error surfacing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("uploadSubmission throws the server's error message, not just the status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: "Image must be smaller than 10MB" }),
      }),
    );

    await expect(
      realApi.uploadSubmission({ file: new Blob(["x"]), lessonId: "lesson-1" }),
    ).rejects.toThrow("Image must be smaller than 10MB");
  });

  test("gradeSubmission falls back to the status when the body has no error field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({}),
      }),
    );

    await expect(realApi.gradeSubmission("sub-1")).rejects.toThrow("Grading failed: 502");
  });
});
