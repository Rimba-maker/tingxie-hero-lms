import type { CharacterResult } from "@/entities/character-result/model/types";

import { GeminiGradingError } from "./gradingErrors";

export type GradeResult = {
  results: CharacterResult[];
  score: number;
  totalPossible: number;
};

// Minimal shape of the @google/genai client this function needs — narrow
// on purpose so tests can inject a fake without pulling in the real SDK.
export type GeminiClient = {
  models: {
    generateContent(args: unknown): Promise<{
      text: string | undefined;
      promptFeedback?: { blockReason?: string };
    }>;
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
  return `Compare the handwriting in this Tian Zige grid against the expected spelling list [${vocabList.join(", ")}]. For each word in the list, return the expected word itself exactly as given in the list (never a transcription of what was actually handwritten, even when it was written incorrectly), whether it was written correctly, and its box_2d bounding box (as [ymin, xmin, ymax, xmax] normalized to 0-1000) around where that word was handwritten in the grid — this drives a red-pen correction overlay on the frontend showing the correct answer, the assignment's key evaluation point.`;
}

// Raw shape Gemini returns, before box_2d (an array) becomes the named
// BoundingBox object the rest of the app uses.
type RawGradedCharacter = {
  character: string;
  isCorrect: boolean;
  box_2d?: [number, number, number, number];
};

export async function gradeWithGemini(
  geminiClient: GeminiClient,
  params: { imageBase64: string; mimeType: string; vocabList: string[] },
): Promise<GradeResult> {
  let response;
  try {
    response = await geminiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: buildPrompt(params.vocabList) },
            { inlineData: { mimeType: params.mimeType, data: params.imageBase64 } },
          ],
        },
      ],
      config: {
        // Nothing previously bounded how long this call could hang - a
        // stalled request (not a fast 503, an actual network/server stall)
        // would leave upload.status stuck at "grading" forever, since the
        // Try again button only appears once a call actually rejects.
        // 60s comfortably covers "a few seconds" (PRD's own performance
        // note) plus real network variance, while still firing well before
        // Vercel's own platform-level function timeout would kill the
        // request with an opaque 504 instead of this catch block's message.
        // Confirmed current and real, not guessed: httpOptions.timeout is a
        // documented GenerateContentConfig field in the installed
        // @google/genai SDK version (verified via Context7 + its own .d.ts).
        httpOptions: { timeout: 60_000 },
        // HIGH costs the same 256 tokens/image as MEDIUM but does "zoomed
        // reframing" (per @google/genai's MediaResolution docs) — better for
        // reading individual handwritten strokes in a Tian Zige grid, at no
        // extra token cost over MEDIUM. LOW (64 tokens) risks losing enough
        // detail that even a human grader would struggle. Verified via
        // Context7, not assumed.
        mediaResolution: "MEDIA_RESOLUTION_HIGH",
        // Content here is always a child's handwriting worksheet — benign by
        // construction. Google's default safety thresholds are tuned for
        // open-ended user content and can false-positive on ordinary photos
        // (paper texture, handwriting strokes read as something else); relax
        // to BLOCK_ONLY_HIGH so a legitimate worksheet photo doesn't get
        // silently blocked. Verified via Context7 (SafetySetting/
        // HarmBlockThreshold), not assumed.
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              character: {
                type: "string",
                description:
                  "The expected word from the spelling list this result grades - always the correct target word exactly as given in the list, never a transcription of what the student actually wrote, even when isCorrect is false.",
              },
              isCorrect: { type: "boolean" },
              box_2d: {
                type: "array",
                items: { type: "integer" },
                description:
                  "[ymin, xmin, ymax, xmax] normalized to 0-1000, bounding this word in the image",
              },
            },
            required: ["character", "isCorrect"],
          },
        },
      },
    });
  } catch (err) {
    // The SDK call itself can reject before we ever see a response shape -
    // a 503 while the model is overloaded, a network failure, etc. Confirmed
    // live (see the -latest alias note above). That's still "Gemini failed",
    // not a generic 500 - map it the same way as a blocked/malformed response.
    if (err instanceof GeminiGradingError) throw err;
    throw new GeminiGradingError("Gemini is temporarily unavailable, please try again");
  }

  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    // Distinct from the generic parse-failure error below: this is a known,
    // named condition (not an unexpected shape), so surface the reason
    // rather than a vague "invalid JSON".
    throw new GeminiGradingError(`Gemini blocked this image: ${blockReason}`);
  }

  let raw: RawGradedCharacter[];
  try {
    if (!response.text) throw new Error("empty response");
    raw = JSON.parse(response.text);
  } catch {
    // responseSchema constrains the shape when Gemini succeeds, but the API
    // is still an untrusted external boundary — never trust it blindly.
    throw new GeminiGradingError("Gemini returned invalid JSON");
  }

  if (!Array.isArray(raw) || raw.length === 0) {
    // A degenerate-but-parseable response (e.g. a blank/unreadable photo).
    // Saving this as a graded 0/0 submission would make every downstream
    // score/totalPossible percentage (ScoreHeader, the Syllabus status
    // label) divide by zero and silently render "NaN%" - treat it as the
    // grading failure it actually is instead.
    throw new GeminiGradingError("Gemini didn't grade any characters, please try again");
  }

  const results: CharacterResult[] = raw.map(({ character, isCorrect, box_2d }) => ({
    character,
    isCorrect,
    ...(box_2d && { boundingBox: { ymin: box_2d[0], xmin: box_2d[1], ymax: box_2d[2], xmax: box_2d[3] } }),
  }));

  const score = results.filter((result) => result.isCorrect).length;

  // Not params.vocabList.length: Gemini sometimes grades each character
  // individually rather than treating a multi-character word as one unit
  // (confirmed live), so the two counts can diverge. totalPossible must
  // match what was actually graded.
  return { results, score, totalPossible: results.length };
}
