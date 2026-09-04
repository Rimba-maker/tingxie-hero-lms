import type { CharacterResult } from "@/entities/character-result/model/types";

export type GradeResult = {
  results: CharacterResult[];
  score: number;
  totalPossible: number;
};

// Minimal shape of the @google/genai client this function needs — narrow
// on purpose so tests can inject a fake without pulling in the real SDK.
export type GeminiClient = {
  models: {
    generateContent(args: unknown): Promise<{ text: string | undefined }>;
  };
};

// gemini-2.5-flash was retired for new API keys sometime after FSD_TingXieHero.md
// was written (confirmed live: 404 NOT_FOUND, "no longer available to new
// users"). Its suggested replacement, gemini-3.6-flash, was itself hitting
// consistent 503 UNAVAILABLE ("high demand") on live testing. Using the
// "-latest" alias Google maintains instead of a dated version pin, so this
// doesn't need another manual bump the next time a specific version is
// deprecated or overloaded.
const GEMINI_MODEL = "gemini-flash-latest";

function buildPrompt(vocabList: string[]): string {
  return `Compare the handwriting in this Tian Zige grid against the expected spelling list [${vocabList.join(", ")}]. Return which words were written correctly or incorrectly.`;
}

export async function gradeWithGemini(
  geminiClient: GeminiClient,
  params: { imageBase64: string; vocabList: string[] },
): Promise<GradeResult> {
  const response = await geminiClient.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: buildPrompt(params.vocabList) },
          { inlineData: { mimeType: "image/jpeg", data: params.imageBase64 } },
        ],
      },
    ],
    config: {
      // HIGH costs the same 256 tokens/image as MEDIUM but does "zoomed
      // reframing" (per @google/genai's MediaResolution docs) — better for
      // reading individual handwritten strokes in a Tian Zige grid, at no
      // extra token cost over MEDIUM. LOW (64 tokens) risks losing enough
      // detail that even a human grader would struggle. Verified via
      // Context7, not assumed.
      mediaResolution: "MEDIA_RESOLUTION_HIGH",
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            character: { type: "string" },
            isCorrect: { type: "boolean" },
          },
          required: ["character", "isCorrect"],
        },
      },
    },
  });

  let results: CharacterResult[];
  try {
    if (!response.text) throw new Error("empty response");
    results = JSON.parse(response.text);
  } catch {
    // responseSchema constrains the shape when Gemini succeeds, but the API
    // is still an untrusted external boundary — never trust it blindly.
    throw new Error("Gemini returned invalid JSON");
  }
  const score = results.filter((result) => result.isCorrect).length;

  return { results, score, totalPossible: params.vocabList.length };
}
