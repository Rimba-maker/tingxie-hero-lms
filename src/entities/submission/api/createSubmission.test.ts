import { describe, expect, test } from "vitest";

import { createSubmission, type SubmissionsDb } from "./createSubmission";

describe("createSubmission", () => {
  test("inserts a pending submission and returns its id", async () => {
    const fakeDb: SubmissionsDb = {
      insertSubmission: async () => ({ id: "sub-123" }),
    };

    const result = await createSubmission(fakeDb, {
      lessonId: "lesson-1",
      imageUrl: "https://example.com/worksheet-photos/photo.jpg",
    });

    expect(result).toEqual({ id: "sub-123" });
  });
});
