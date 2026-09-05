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

  test("maps Gemini's box_2d array into a boundingBox object per character", async () => {
    const fakeGemini: GeminiClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify([
            { character: "校园", isCorrect: true, box_2d: [100, 200, 300, 400] },
            { character: "礼堂", isCorrect: false },
          ]),
        }),
      },
    };

    const result = await gradeWithGemini(fakeGemini, {
      imageBase64: "fake-base64-image-data",
      vocabList: ["校园", "礼堂"],
    });

    expect(result.results).toEqual([
      {
        character: "校园",
        isCorrect: true,
        boundingBox: { ymin: 100, xmin: 200, ymax: 300, xmax: 400 },
      },
      { character: "礼堂", isCorrect: false },
    ]);
  });

  test("totalPossible reflects the actual result count, not the vocab list length", async () => {
    // Real behavior observed live: Gemini sometimes grades each individual
    // character rather than treating each 2-character word as one unit, so
    // a 3-word vocabList can come back as 6 results. totalPossible must
    // track what was actually graded, not what we assumed going in.
    const fakeGemini: GeminiClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify([
            { character: "校", isCorrect: false },
            { character: "园", isCorrect: false },
            { character: "礼", isCorrect: false },
            { character: "堂", isCorrect: false },
            { character: "老", isCorrect: false },
            { character: "师", isCorrect: false },
          ]),
        }),
      },
    };

    const result = await gradeWithGemini(fakeGemini, {
      imageBase64: "fake-base64-image-data",
      vocabList: ["校园", "礼堂", "老师"],
    });

    expect(result.results).toHaveLength(6);
    expect(result.totalPossible).toBe(6);
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

  test("throws a specific error naming the reason when Gemini blocks the image", async () => {
    const blockedGemini: GeminiClient = {
      models: {
        generateContent: async () => ({
          text: undefined,
          promptFeedback: { blockReason: "SAFETY" },
        }),
      },
    };

    await expect(
      gradeWithGemini(blockedGemini, {
        imageBase64: "fake-base64-image-data",
        vocabList: ["校园"],
      }),
    ).rejects.toThrow("Gemini blocked this image: SAFETY");
  });

  test("throws the generic invalid-JSON error when text is empty with no block reason", async () => {
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
