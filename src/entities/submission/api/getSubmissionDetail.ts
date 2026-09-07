import type { SupabaseClient } from "@supabase/supabase-js";

import type { BoundingBox, CharacterResult } from "@/entities/character-result/model/types";
import type { VocabEntry } from "@/entities/lesson/model/types";

import { SubmissionNotFoundError } from "./gradingErrors";

export type SubmissionDetail = {
  id: string;
  score: number | null;
  totalPossible: number;
  submittedAt: string;
  imageUrl: string;
  lessonId: string | null;
  lessonWeekNumber: number | null;
  characterResults: CharacterResult[];
  vocabulary: VocabEntry[];
};

export type SubmissionDetailDb = {
  findSubmissionDetail(submissionId: string): Promise<SubmissionDetail | null>;
};

export async function getSubmissionDetail(
  db: SubmissionDetailDb,
  submissionId: string,
): Promise<SubmissionDetail> {
  const result = await db.findSubmissionDetail(submissionId);
  if (!result) {
    throw new SubmissionNotFoundError(submissionId);
  }
  return result;
}

type SubmissionRow = {
  id: string;
  total_score: number | null;
  total_possible: number;
  submitted_at: string;
  image_url: string;
  lesson_id: string | null;
  lessons: { week_number: number; vocabulary: VocabEntry[] } | null;
  character_results: { character: string; is_correct: boolean; bounding_box: BoundingBox | null }[];
};

// Real Supabase-backed implementation. Untested glue.
export function supabaseSubmissionDetailDb(supabase: SupabaseClient): SubmissionDetailDb {
  return {
    async findSubmissionDetail(submissionId) {
      const { data, error } = await supabase
        .from("submissions")
        .select(
          "id, total_score, total_possible, submitted_at, image_url, lesson_id, lessons(week_number, vocabulary), character_results(character, is_correct, bounding_box)",
        )
        .eq("id", submissionId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const row = data as unknown as SubmissionRow;
      return {
        id: row.id,
        score: row.total_score,
        totalPossible: row.total_possible,
        submittedAt: row.submitted_at,
        imageUrl: row.image_url,
        lessonId: row.lesson_id,
        lessonWeekNumber: row.lessons?.week_number ?? null,
        characterResults: row.character_results.map((r) => ({
          character: r.character,
          isCorrect: r.is_correct,
          ...(r.bounding_box && { boundingBox: r.bounding_box }),
        })),
        vocabulary: row.lessons?.vocabulary ?? [],
      };
    },
  };
}
