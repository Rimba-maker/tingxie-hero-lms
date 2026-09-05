import { listSubmissionHistory, supabaseSubmissionHistoryDb } from "@/entities/submission/api/listSubmissionHistory";
import { HistoryScreen } from "@/screens/history/ui/HistoryScreen";
import { getSupabaseServer } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const submissions = await listSubmissionHistory(supabaseSubmissionHistoryDb(getSupabaseServer()));

  return (
    <HistoryScreen
      viewer={{ parentName: "Sarah", studentName: "Lucas", moeLevel: "Primary 2" }}
      submissions={submissions}
    />
  );
}
