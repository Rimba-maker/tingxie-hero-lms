import { describe, expect, test } from "vitest";

import { getSubmissionDetail, type SubmissionDetailDb } from "./getSubmissionDetail";

describe("getSubmissionDetail", () => {
  test("returns the submission with its character results", async () => {
    const fakeDb: SubmissionDetailDb = {
      findSubmissionDetail: async () => ({
        id: "sub-123",
        score: 8,
        totalPossible: 10,
        submittedAt: "2026-10-14T15:12:00Z",
        imageUrl: "https://example.com/worksheet-photos/abc123.jpg",
        lessonWeekNumber: 4,
        characterResults: [
          { character: "校园", isCorrect: true },
          { character: "礼堂", isCorrect: false },
        ],
      }),
    };

    const result = await getSubmissionDetail(fakeDb, "sub-123");

    expect(result).toEqual({
      id: "sub-123",
      score: 8,
      totalPossible: 10,
      submittedAt: "2026-10-14T15:12:00Z",
      imageUrl: "https://example.com/worksheet-photos/abc123.jpg",
      lessonWeekNumber: 4,
      characterResults: [
        { character: "校园", isCorrect: true },
        { character: "礼堂", isCorrect: false },
      ],
    });
  });

  test("throws a clear error when the submission doesn't exist", async () => {
    const fakeDb: SubmissionDetailDb = {
      findSubmissionDetail: async () => null,
    };

    await expect(getSubmissionDetail(fakeDb, "missing-id")).rejects.toThrow(
      "Submission not found: missing-id",
    );
  });
});
