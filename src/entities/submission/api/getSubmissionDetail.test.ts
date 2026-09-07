import { describe, expect, test } from "vitest";

import { getSubmissionDetail, type SubmissionDetailDb } from "./getSubmissionDetail";
import { SubmissionNotFoundError } from "./gradingErrors";

describe("getSubmissionDetail", () => {
  test("returns the submission with its character results", async () => {
    const fakeDb: SubmissionDetailDb = {
      findSubmissionDetail: async () => ({
        id: "sub-123",
        score: 8,
        totalPossible: 10,
        submittedAt: "2026-10-14T15:12:00Z",
        imageUrl: "https://example.com/worksheet-photos/abc123.jpg",
        lessonId: "lesson-4",
        lessonWeekNumber: 4,
        characterResults: [
          { character: "校园", isCorrect: true },
          { character: "礼堂", isCorrect: false },
        ],
        vocabulary: [
          { character: "校园", pinyin: "xiào yuán" },
          { character: "礼堂", pinyin: "lǐ táng" },
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
      lessonId: "lesson-4",
      lessonWeekNumber: 4,
      characterResults: [
        { character: "校园", isCorrect: true },
        { character: "礼堂", isCorrect: false },
      ],
      vocabulary: [
        { character: "校园", pinyin: "xiào yuán" },
        { character: "礼堂", pinyin: "lǐ táng" },
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

  test("throws the typed SubmissionNotFoundError, not a plain Error", async () => {
    // Server Component errors get their message/name stripped to a generic
    // digest by Next.js in production (confirmed live: a plain Error's
    // message never reaches error.tsx there) - the page must be able to
    // recognize this specific failure by type, before it crosses that
    // boundary, to route it to notFound() instead of the generic error UI.
    const fakeDb: SubmissionDetailDb = {
      findSubmissionDetail: async () => null,
    };

    await expect(getSubmissionDetail(fakeDb, "missing-id")).rejects.toBeInstanceOf(
      SubmissionNotFoundError,
    );
  });
});
