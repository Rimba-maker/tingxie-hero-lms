import type { CharacterResult } from "@/entities/character-result/model/types";
import type { GradeResult } from "./gradeWithGemini";

export type CharacterResultsDb = {
  insertCharacterResults(submissionId: string, results: CharacterResult[]): Promise<void>;
  markSubmissionGraded(
    submissionId: string,
    params: { score: number; totalPossible: number },
  ): Promise<void>;
};

export async function saveGradingResult(
  db: CharacterResultsDb,
  submissionId: string,
  grade: GradeResult,
): Promise<void> {
  await db.insertCharacterResults(submissionId, grade.results);
  await db.markSubmissionGraded(submissionId, {
    score: grade.score,
    totalPossible: grade.totalPossible,
  });
}
