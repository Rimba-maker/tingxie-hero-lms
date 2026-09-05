import type { SupabaseClient } from "@supabase/supabase-js";

export const TOP_UP_AMOUNT = 10;

export type TopUpCreditsDb = {
  incrementCreditsTotal(studentId: string, amount: number): Promise<{ creditsTotal: number }>;
};

export async function topUpCredits(
  db: TopUpCreditsDb,
  studentId: string,
): Promise<{ creditsTotal: number }> {
  return db.incrementCreditsTotal(studentId, TOP_UP_AMOUNT);
}

// Real Supabase-backed implementation. Untested glue.
// Read-then-write, not atomic — acceptable here: single hardcoded student,
// no auth, no concurrent writers possible in this assignment's scope.
export function supabaseTopUpCreditsDb(supabase: SupabaseClient): TopUpCreditsDb {
  return {
    async incrementCreditsTotal(studentId, amount) {
      const { data, error } = await supabase
        .from("students")
        .select("credits_total")
        .eq("id", studentId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(`Student not found: ${studentId}`);

      const creditsTotal = data.credits_total + amount;
      const { error: updateError } = await supabase
        .from("students")
        .update({ credits_total: creditsTotal })
        .eq("id", studentId);
      if (updateError) throw updateError;

      return { creditsTotal };
    },
  };
}
