import type { SupabaseClient } from "@supabase/supabase-js";

import type { Lesson, VocabEntry } from "@/entities/lesson/model/types";

type LessonRow = {
  id: string;
  week_number: number;
  title: string;
  moe_level: string;
  status: string;
  vocabulary: VocabEntry[];
};

function mapLessonRow(row: LessonRow): Lesson {
  return {
    id: row.id,
    weekNumber: row.week_number,
    title: row.title,
    moeLevel: row.moe_level,
    status: row.status as Lesson["status"],
    vocabulary: row.vocabulary,
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
        .select("id, week_number, title, moe_level, status, vocabulary")
        .order("week_number", { ascending: false });
      if (error) throw error;
      return data;
    },
  };
}
