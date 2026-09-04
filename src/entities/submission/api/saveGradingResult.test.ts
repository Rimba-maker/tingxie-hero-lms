import { describe, expect, test } from "vitest";

import type { CharacterResult } from "@/entities/character-result/model/types";

import { saveGradingResult, type CharacterResultsDb } from "./saveGradingResult";

describe("saveGradingResult", () => {
  test("saves character results and marks the submission graded", async () => {
    const savedResults: { submissionId: string; results: CharacterResult[] }[] = [];
    const gradedSubmissions: { submissionId: string; score: number; totalPossible: number }[] = [];

    const fakeDb: CharacterResultsDb = {
      insertCharacterResults: async (submissionId, results) => {
        savedResults.push({ submissionId, results });
      },
      markSubmissionGraded: async (submissionId, { score, totalPossible }) => {
        gradedSubmissions.push({ submissionId, score, totalPossible });
      },
    };

    await saveGradingResult(fakeDb, "sub-123", {
      results: [
        { character: "校园", isCorrect: true },
        { character: "礼堂", isCorrect: false },
      ],
      score: 1,
      totalPossible: 2,
    });

    expect(savedResults).toEqual([
      {
        submissionId: "sub-123",
        results: [
          { character: "校园", isCorrect: true },
          { character: "礼堂", isCorrect: false },
        ],
      },
    ]);
    expect(gradedSubmissions).toEqual([{ submissionId: "sub-123", score: 1, totalPossible: 2 }]);
  });
});
