import { describe, expect, test } from "vitest";

import { gradeWithGemini, type GeminiClient } from "./gradeWithGemini";

describe("gradeWithGemini", () => {
  test("computes score from the graded characters Gemini returns", async () => {
    const fakeGemini: GeminiClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify([
            { character: "校园", isCorrect: true },
            { character: "礼堂", isCorrect: false },
            { character: "老师", isCorrect: true },
          ]),
        }),
      },
    };

    const result = await gradeWithGemini(fakeGemini, {
      imageBase64: "fake-base64-image-data",
      vocabList: ["校园", "礼堂", "老师"],
    });

    expect(result.score).toBe(2);
    expect(result.totalPossible).toBe(3);
    expect(result.results).toEqual([
      { character: "校园", isCorrect: true },
      { character: "礼堂", isCorrect: false },
      { character: "老师", isCorrect: true },
    ]);
  });

  test("throws a clear error when Gemini's response isn't valid JSON", async () => {
    const brokenGemini: GeminiClient = {
      models: {
        generateContent: async () => ({ text: "not valid json" }),
      },
    };

    await expect(
      gradeWithGemini(brokenGemini, {
        imageBase64: "fake-base64-image-data",
        vocabList: ["校园"],
      }),
    ).rejects.toThrow("Gemini returned invalid JSON");
  });

  test("throws a clear error when Gemini returns no text (e.g. blocked by safety filters)", async () => {
    const emptyGemini: GeminiClient = {
      models: {
        generateContent: async () => ({ text: undefined }),
      },
    };

    await expect(
      gradeWithGemini(emptyGemini, {
        imageBase64: "fake-base64-image-data",
        vocabList: ["校园"],
      }),
    ).rejects.toThrow("Gemini returned invalid JSON");
  });
});
