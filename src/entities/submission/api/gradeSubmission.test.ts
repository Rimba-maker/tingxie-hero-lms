import { describe, expect, test, vi } from "vitest";

import type { CharacterResultsDb } from "./saveGradingResult";
import type { GeminiClient } from "./gradeWithGemini";
import { gradeSubmission, type GradeSubmissionDeps } from "./gradeSubmission";
import { SubmissionNotFoundError } from "./gradingErrors";
import type { SubmissionForGradingDb } from "./getSubmissionForGrading";

function makeDeps(overrides: Partial<GradeSubmissionDeps> = {}): GradeSubmissionDeps {
  const gradingDb: SubmissionForGradingDb = {
    findSubmissionForGrading: async () => ({
      imageUrl: "https://example.com/worksheet.jpg",
      vocabList: ["校园", "礼堂"],
    }),
  };
  const resultsDb: CharacterResultsDb = {
    insertCharacterResults: async () => {},
    markSubmissionGraded: async () => {},
  };
  const gemini: GeminiClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify([
          { character: "校园", isCorrect: true },
          { character: "礼堂", isCorrect: false },
        ]),
      }),
    },
  };
  const fetchImageAsBase64 = vi.fn(async () => ({
    imageBase64: "fake-base64-image-data",
    mimeType: "image/jpeg",
  }));

  return { gradingDb, resultsDb, gemini, fetchImageAsBase64, ...overrides };
}

describe("gradeSubmission", () => {
  test("orchestrates fetch submission -> fetch image -> grade -> persist, in order", async () => {
    const calls: string[] = [];
    const deps = makeDeps({
      gradingDb: {
        findSubmissionForGrading: async (id) => {
          calls.push(`grading:${id}`);
          return { imageUrl: "https://example.com/worksheet.jpg", vocabList: ["校园"] };
        },
      },
      fetchImageAsBase64: async (url) => {
        calls.push(`fetch:${url}`);
        return { imageBase64: "fake-base64", mimeType: "image/jpeg" };
      },
      gemini: {
        models: {
          generateContent: async () => {
            calls.push("gemini");
            return { text: JSON.stringify([{ character: "校园", isCorrect: true }]) };
          },
        },
      },
      resultsDb: {
        insertCharacterResults: async () => {
          calls.push("insert");
        },
        markSubmissionGraded: async () => {
          calls.push("markGraded");
        },
      },
    });

    await gradeSubmission(deps, "sub-123");

    expect(calls).toEqual([
      "grading:sub-123",
      "fetch:https://example.com/worksheet.jpg",
      "gemini",
      "insert",
      "markGraded",
    ]);
  });

  test("returns the submissionId, score, totalPossible, and per-character results", async () => {
    const deps = makeDeps();

    const result = await gradeSubmission(deps, "sub-123");

    expect(result).toEqual({
      submissionId: "sub-123",
      score: 1,
      totalPossible: 2,
      results: [
        { character: "校园", isCorrect: true },
        { character: "礼堂", isCorrect: false },
      ],
    });
  });

  test("never fetches the image or calls Gemini when the submission doesn't exist", async () => {
    const fetchImageAsBase64 = vi.fn();
    const generateContent = vi.fn();
    const deps = makeDeps({
      gradingDb: { findSubmissionForGrading: async () => null },
      fetchImageAsBase64,
      gemini: { models: { generateContent } },
    });

    await expect(gradeSubmission(deps, "missing-id")).rejects.toBeInstanceOf(
      SubmissionNotFoundError,
    );
    expect(fetchImageAsBase64).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });
});
