import type { SupabaseClient } from "@supabase/supabase-js";

import type { Lesson, VocabEntry } from "@/entities/lesson/model/types";

type LessonRow = {
  id: string;
  week_number: number;
  title: string;
  moe_level: string;
  status: string;
  vocabulary: VocabEntry[];
  test_scheduled_at: string | null;
  // Embedded, ordered submitted_at desc + limited to 5 by the query below —
  // the lesson's most recent attempts, not necessarily all graded yet.
  submissions: { total_score: number | null; total_possible: number }[];
};

function mapLessonRow(row: LessonRow): Lesson {
  // submissions arrives most-recent-first. A stuck-pending retry (no
  // total_score yet) shouldn't hide the last submission that actually got
  // graded - find the most recent graded one, falling back to the very
  // latest row (still null) when this lesson has never been graded at all.
  const latest = row.submissions.find((s) => s.total_score !== null) ?? row.submissions[0];
  return {
    id: row.id,
    weekNumber: row.week_number,
    title: row.title,
    moeLevel: row.moe_level,
    status: row.status as Lesson["status"],
    vocabulary: row.vocabulary,
    testScheduledAt: row.test_scheduled_at,
    latestScore:
      latest && latest.total_score !== null
        ? { score: latest.total_score, totalPossible: latest.total_possible }
        : null,
  };
}

export type LessonsDb = {
  listLessons(): Promise<LessonRow[]>;
};

export async function getLessons(db: LessonsDb): Promise<Lesson[]> {
  const rows = await db.listLessons();
  return rows.map(mapLessonRow);
}

// Real Supabase-backed implementation. Untested glue.
export function supabaseLessonsDb(supabase: SupabaseClient): LessonsDb {
  return {
    async listLessons() {
      const { data, error } = await supabase
        .from("lessons")
        .select(
          "id, week_number, title, moe_level, status, vocabulary, test_scheduled_at, submissions(total_score, total_possible, submitted_at)",
        )
        .order("week_number", { ascending: false })
        .order("submitted_at", { foreignTable: "submissions", ascending: false })
        // 5, not 1: mapLessonRow needs to look past a stuck-pending retry to
        // find the last submission that actually got graded, not just the
        // single most recent row regardless of whether it ever finished.
        .limit(5, { foreignTable: "submissions" });
      if (error) throw error;
      return data;
    },
  };
}
