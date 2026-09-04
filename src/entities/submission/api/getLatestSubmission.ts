import type { SupabaseClient } from "@supabase/supabase-js";

export type LatestSubmissionDb = {
  findLatestSubmissionId(): Promise<string | null>;
};

export async function getLatestSubmission(
  db: LatestSubmissionDb,
): Promise<{ id: string } | null> {
  const id = await db.findLatestSubmissionId();
  return id ? { id } : null;
}

// Real Supabase-backed implementation. Untested glue.
export function supabaseLatestSubmissionDb(supabase: SupabaseClient): LatestSubmissionDb {
  return {
    async findLatestSubmissionId() {
      const { data, error } = await supabase
        .from("submissions")
        .select("id")
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  };
}
