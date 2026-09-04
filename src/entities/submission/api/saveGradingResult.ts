import type { SupabaseClient } from "@supabase/supabase-js";

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

// Real Supabase-backed implementation. Untested glue.
export function supabaseCharacterResultsDb(supabase: SupabaseClient): CharacterResultsDb {
  return {
    async insertCharacterResults(submissionId, results) {
      const { error } = await supabase.from("character_results").insert(
        results.map((result) => ({
          submission_id: submissionId,
          character: result.character,
          is_correct: result.isCorrect,
        })),
      );
      if (error) throw error;
    },
    async markSubmissionGraded(submissionId, { score, totalPossible }) {
      const { error } = await supabase
        .from("submissions")
        .update({
          status: "graded",
          total_score: score,
          total_possible: totalPossible,
          graded_at: new Date().toISOString(),
        })
        .eq("id", submissionId);
      if (error) throw error;
    },
  };
}
