import { describe, expect, test, vi } from "vitest";

import { gradeWithGemini, type GeminiClient } from "./gradeWithGemini";
import { GeminiGradingError } from "./gradingErrors";

describe("gradeWithGemini", () => {
  test("sends the caller's actual mimeType to Gemini, not a hardcoded one", async () => {
    // A real ImageCapture.takePhoto() capture isn't guaranteed to be JPEG
    // (confirmed via MDN) - previously this was hardcoded to "image/jpeg"
    // regardless of what format the stored photo actually was.
    const generateContent = vi.fn<GeminiClient["models"]["generateContent"]>(async () => ({
      text: JSON.stringify([]),
    }));
    const fakeGemini: GeminiClient = { models: { generateContent } };

    await gradeWithGemini(fakeGemini, {
      imageBase64: "fake-base64-image-data",
      mimeType: "image/png",
      vocabList: ["校园"],
    }).catch(() => {}); // empty results throws (Phase 22) - only the call args matter here

    const call = generateContent.mock.calls[0][0] as {
      contents: { parts: { inlineData?: { mimeType: string } }[] }[];
    };
    expect(call.contents[0].parts[1].inlineData?.mimeType).toBe("image/png");
  });

  test("instructs Gemini the character field is always the expected word, never a transcription", async () => {
    // Confirmed live against the real Gemini API: with no such instruction,
    // a wrong answer's "character" field came back as what the student
    // actually wrote (e.g. "爸" for a "妈妈" vocab word written incorrectly),
    // not the expected word - WorksheetOverlay renders this exact field as
    // "Correct word: {character}" on the results screen, so this silently
    // showed parents their child's own wrong answer as if it were the
    // correction. This is the regression guard for that instruction, since
    // the app code itself just passes Gemini's string through unchanged -
    // nothing here is testable except that the instruction is actually sent.
    const generateContent = vi.fn<GeminiClient["models"]["generateContent"]>(async () => ({
      text: JSON.stringify([]),
    }));
    const fakeGemini: GeminiClient = { models: { generateContent } };

    await gradeWithGemini(fakeGemini, {
      imageBase64: "fake-base64-image-data",
      mimeType: "image/jpeg",
      vocabList: ["妈妈"],
    }).catch(() => {});

    const call = generateContent.mock.calls[0][0] as {
      contents: { parts: { text?: string }[] }[];
      config: { responseSchema: { items: { properties: { character: { description?: string } } } } };
    };
    const promptText = call.contents[0].parts[0].text ?? "";
    const schemaDescription = call.config.responseSchema.items.properties.character.description ?? "";

    expect(promptText).toMatch(/never a transcription of what was actually handwritten/);
    expect(schemaDescription).toMatch(/never a transcription of what the student actually wrote/);
  });

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
      mimeType: "image/jpeg",
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
      mimeType: "image/jpeg",
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
      mimeType: "image/jpeg",
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
      mimeType: "image/jpeg",
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
      mimeType: "image/jpeg",
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
      mimeType: "image/jpeg",
        vocabList: ["校园"],
      }),
    ).rejects.toThrow("Gemini returned invalid JSON");
  });

  test("wraps an SDK-level failure (e.g. a 503 while Gemini is overloaded) in GeminiGradingError too", async () => {
    // Confirmed live: generateContent() itself can reject before we ever
    // see a response shape - the SDK's own ApiError for a 503 "high
    // demand" failure, not a successful-but-blocked/malformed response.
    // Previously this fell through to the generic 500 uncaught.
    const overloadedGemini: GeminiClient = {
      models: {
        generateContent: async () => {
          throw new Error(
            '{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}',
          );
        },
      },
    };

    await expect(
      gradeWithGemini(overloadedGemini, { imageBase64: "x", mimeType: "image/jpeg", vocabList: ["校园"] }),
    ).rejects.toBeInstanceOf(GeminiGradingError);
  });

  test("gives a distinct, actionable message for a free-tier daily quota hit (429 RESOURCE_EXHAUSTED)", async () => {
    // Confirmed live against the real API on the free tier: distinct from
    // the transient 503 above, this is Google's named status for "the daily
    // request cap for this API key is used up" - retrying immediately can't
    // help, so the generic "please try again" message would be actively
    // misleading here.
    const quotaExhaustedGemini: GeminiClient = {
      models: {
        generateContent: async () => {
          throw new Error(
            '{"error":{"code":429,"message":"You exceeded your current quota...","status":"RESOURCE_EXHAUSTED"}}',
          );
        },
      },
    };

    await expect(
      gradeWithGemini(quotaExhaustedGemini, { imageBase64: "x", mimeType: "image/jpeg", vocabList: ["校园"] }),
    ).rejects.toThrow("Please try again tomorrow");
  });

  test("throws instead of returning a 0/0 result when Gemini graded nothing", async () => {
    // A degenerate-but-valid-JSON response (e.g. a blank/unreadable photo).
    // Saving this as-is would set totalPossible to 0, and every percentage
    // computed from score/totalPossible downstream (ScoreHeader, the
    // Syllabus status label) divides by it - 0/0 is NaN in JS, so this would
    // otherwise silently render "NaN%" instead of a real error.
    const emptyResultsGemini: GeminiClient = {
      models: {
        generateContent: async () => ({ text: "[]" }),
      },
    };

    await expect(
      gradeWithGemini(emptyResultsGemini, { imageBase64: "x", mimeType: "image/jpeg", vocabList: ["校园"] }),
    ).rejects.toThrow("Gemini didn't grade any characters, please try again");
  });

  test("every Gemini-side failure throws the typed GeminiGradingError, not a plain Error", async () => {
    const blockedGemini: GeminiClient = {
      models: {
        generateContent: async () => ({ text: undefined, promptFeedback: { blockReason: "SAFETY" } }),
      },
    };

    await expect(
      gradeWithGemini(blockedGemini, { imageBase64: "x", mimeType: "image/jpeg", vocabList: ["校园"] }),
    ).rejects.toBeInstanceOf(GeminiGradingError);
  });
});
