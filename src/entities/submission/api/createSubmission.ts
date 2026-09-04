import type { SupabaseClient } from "@supabase/supabase-js";

// Narrow, single-purpose interface — easier to fake in tests than the full
// chainable SupabaseClient query builder. The real implementation (wiring
// this to `supabaseServer`) lives at the API route composition root.
export type SubmissionsDb = {
  insertSubmission(params: { lessonId: string; imageUrl: string }): Promise<{ id: string }>;
};

export async function createSubmission(
  db: SubmissionsDb,
  params: { lessonId: string; imageUrl: string },
): Promise<{ id: string }> {
  return db.insertSubmission(params);
}

// Real Supabase-backed implementation. Untested glue (the logic worth
// testing is createSubmission above) — status/student_id use the DB's
// defaults per supabase/schema.sql.
export function supabaseSubmissionsDb(supabase: SupabaseClient): SubmissionsDb {
  return {
    async insertSubmission({ lessonId, imageUrl }) {
      const { data, error } = await supabase
        .from("submissions")
        .insert({ lesson_id: lessonId, image_url: imageUrl })
        .select("id")
        .single();
      if (error) throw error;
      return { id: data.id };
    },
  };
}
