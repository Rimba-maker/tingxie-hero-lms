import type { SupabaseClient } from "@supabase/supabase-js";

import { SubmissionNotFoundError } from "./gradingErrors";

export type SubmissionForGradingDb = {
  findSubmissionForGrading(
    submissionId: string,
  ): Promise<{ imageUrl: string; vocabList: string[] } | null>;
};

export async function getSubmissionForGrading(
  db: SubmissionForGradingDb,
  submissionId: string,
): Promise<{ imageUrl: string; vocabList: string[] }> {
  const result = await db.findSubmissionForGrading(submissionId);
  if (!result) {
    throw new SubmissionNotFoundError(submissionId);
  }
  return result;
}

type LessonVocabEntry = { character: string; pinyin: string };

// Real Supabase-backed implementation. Untested glue — joins submissions to
// their lesson via the lesson_id foreign key (supabase/schema.sql) to read
// the vocab list in one round trip.
export function supabaseGradingDb(supabase: SupabaseClient): SubmissionForGradingDb {
  return {
    async findSubmissionForGrading(submissionId) {
      const { data, error } = await supabase
        .from("submissions")
        .select("image_url, lessons(vocabulary)")
        .eq("id", submissionId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const lesson = data.lessons as unknown as { vocabulary: LessonVocabEntry[] } | null;
      if (!lesson) return null;

      return {
        imageUrl: data.image_url,
        vocabList: lesson.vocabulary.map((entry) => entry.character),
      };
    },
  };
}
