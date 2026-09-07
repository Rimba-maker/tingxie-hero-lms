import type { SupabaseClient } from "@supabase/supabase-js";

import type { StudentCredits } from "@/entities/student/model/types";

export type StudentCreditsDb = {
  findStudentCredits(
    studentId: string,
  ): Promise<{ creditsTotal: number; creditsExpireAt: string; submissionsCount: number } | null>;
};

export async function getStudentCredits(db: StudentCreditsDb, studentId: string): Promise<StudentCredits> {
  const result = await db.findStudentCredits(studentId);
  if (!result) {
    throw new Error(`Student not found: ${studentId}`);
  }
  return { total: result.creditsTotal, used: result.submissionsCount, expiresOn: result.creditsExpireAt };
}

// Real Supabase-backed implementation. Untested glue.
export function supabaseStudentCreditsDb(supabase: SupabaseClient): StudentCreditsDb {
  return {
    async findStudentCredits(studentId) {
      const [studentResult, countResult] = await Promise.all([
        supabase.from("students").select("credits_total, credits_expire_at").eq("id", studentId).maybeSingle(),
        // Only a completed grading attempt actually consumes a credit - a
        // submission stuck 'pending' (Gemini failed/timed out) or 'failed'
        // shouldn't permanently cost the parent a scan they never received.
        supabase
          .from("submissions")
          .select("id", { count: "exact", head: true })
          .eq("student_id", studentId)
          .eq("status", "graded"),
      ]);
      if (studentResult.error) throw studentResult.error;
      if (countResult.error) throw countResult.error;
      if (!studentResult.data) return null;

      return {
        creditsTotal: studentResult.data.credits_total,
        creditsExpireAt: studentResult.data.credits_expire_at,
        submissionsCount: countResult.count ?? 0,
      };
    },
  };
}
