import { listSubmissionHistory, supabaseSubmissionHistoryDb } from "@/entities/submission/api/listSubmissionHistory";
import { HistoryScreen } from "@/screens/history/ui/HistoryScreen";
import { getSupabaseServer } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const submissions = await listSubmissionHistory(supabaseSubmissionHistoryDb(getSupabaseServer()));

  return (
    <HistoryScreen parentName="Sarah" studentName="Lucas" moeLevel="P2" submissions={submissions} />
  );
}
