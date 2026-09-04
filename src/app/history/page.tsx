import { redirect } from "next/navigation";

import { getLatestSubmission, supabaseLatestSubmissionDb } from "@/entities/submission/api/getLatestSubmission";
import { getSupabaseServer } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

// Per PRD_TingXieHero.md: History has no screen of its own — it routes to
// the most recent graded Results screen instead.
export default async function HistoryPage() {
  const latest = await getLatestSubmission(supabaseLatestSubmissionDb(getSupabaseServer()));
  redirect(latest ? `/results/${latest.id}` : "/");
}
