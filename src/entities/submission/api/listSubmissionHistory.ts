import type { SupabaseClient } from "@supabase/supabase-js";

export type SubmissionSummary = {
  id: string;
  submittedAt: string;
  lessonWeekNumber: number | null;
  lessonTitle: string | null;
  score: number | null;
  totalPossible: number;
};

export type SubmissionHistoryDb = {
  findGradedSubmissions(): Promise<SubmissionSummary[]>;
};

export async function listSubmissionHistory(db: SubmissionHistoryDb): Promise<SubmissionSummary[]> {
  return db.findGradedSubmissions();
}

type SubmissionRow = {
  id: string;
  total_score: number | null;
  total_possible: number;
  submitted_at: string;
  lessons: { week_number: number; title: string } | null;
};

// Real Supabase-backed implementation. Untested glue.
export function supabaseSubmissionHistoryDb(supabase: SupabaseClient): SubmissionHistoryDb {
  return {
    async findGradedSubmissions() {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, total_score, total_possible, submitted_at, lessons(week_number, title)")
        .eq("status", "graded")
        .order("submitted_at", { ascending: false });
      if (error) throw error;

      return ((data ?? []) as unknown as SubmissionRow[]).map((row) => ({
        id: row.id,
        submittedAt: row.submitted_at,
        lessonWeekNumber: row.lessons?.week_number ?? null,
        lessonTitle: row.lessons?.title ?? null,
        score: row.total_score,
        totalPossible: row.total_possible,
      }));
    },
  };
}
