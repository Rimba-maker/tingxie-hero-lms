import { describe, expect, test } from "vitest";

import {
  getSubmissionForGrading,
  type SubmissionForGradingDb,
} from "./getSubmissionForGrading";
import { SubmissionNotFoundError } from "./gradingErrors";

describe("getSubmissionForGrading", () => {
  test("returns the submission's image and its lesson's vocab list", async () => {
    const fakeDb: SubmissionForGradingDb = {
      findSubmissionForGrading: async () => ({
        imageUrl: "https://example.com/worksheet-photos/abc123.jpg",
        vocabList: ["校园", "礼堂", "老师"],
      }),
    };

    const result = await getSubmissionForGrading(fakeDb, "sub-123");

    expect(result).toEqual({
      imageUrl: "https://example.com/worksheet-photos/abc123.jpg",
      vocabList: ["校园", "礼堂", "老师"],
    });
  });

  test("throws a clear error when the submission doesn't exist", async () => {
    const fakeDb: SubmissionForGradingDb = {
      findSubmissionForGrading: async () => null,
    };

    await expect(getSubmissionForGrading(fakeDb, "missing-id")).rejects.toThrow(
      "Submission not found: missing-id",
    );
  });

  test("throws the typed SubmissionNotFoundError, not a plain Error", async () => {
    const fakeDb: SubmissionForGradingDb = {
      findSubmissionForGrading: async () => null,
    };

    await expect(getSubmissionForGrading(fakeDb, "missing-id")).rejects.toBeInstanceOf(
      SubmissionNotFoundError,
    );
  });
});
