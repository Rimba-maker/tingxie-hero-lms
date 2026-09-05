import type { CharacterResult } from "@/entities/character-result/model/types";

import { getSubmissionForGrading, type SubmissionForGradingDb } from "./getSubmissionForGrading";
import { gradeWithGemini, type GeminiClient } from "./gradeWithGemini";
import { saveGradingResult, type CharacterResultsDb } from "./saveGradingResult";

export type GradeSubmissionDeps = {
  gradingDb: SubmissionForGradingDb;
  resultsDb: CharacterResultsDb;
  gemini: GeminiClient;
  fetchImageAsBase64: (imageUrl: string) => Promise<string>;
};

export type GradeSubmissionResult = {
  submissionId: string;
  score: number;
  totalPossible: number;
  results: CharacterResult[];
};

// Owns the grading pipeline end to end: fetch the submission's image/vocab,
// fetch and encode the image, grade it with Gemini, persist the result.
// Previously this sequence lived directly in POST /api/grade with no name
// and no test of its own — only the individual steps were tested in
// isolation, never the orchestration that wires them together.
export async function gradeSubmission(
  deps: GradeSubmissionDeps,
  submissionId: string,
): Promise<GradeSubmissionResult> {
  const { imageUrl, vocabList } = await getSubmissionForGrading(deps.gradingDb, submissionId);
  const imageBase64 = await deps.fetchImageAsBase64(imageUrl);
  const grade = await gradeWithGemini(deps.gemini, { imageBase64, vocabList });
  await saveGradingResult(deps.resultsDb, submissionId, grade);

  return {
    submissionId,
    score: grade.score,
    totalPossible: grade.totalPossible,
    results: grade.results,
  };
}

// Real implementation. Untested glue — a real network fetch, same category
// as the Supabase/Gemini SDK calls elsewhere in this file's siblings.
export async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  return Buffer.from(await response.arrayBuffer()).toString("base64");
}
