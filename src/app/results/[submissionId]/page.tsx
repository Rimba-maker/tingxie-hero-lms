import {
  getCharacterHistory,
  supabaseCharacterHistoryDb,
} from "@/entities/character-result/api/getCharacterHistory";
import { getSubmissionDetail, supabaseSubmissionDetailDb } from "@/entities/submission/api/getSubmissionDetail";
import { ResultsScreen } from "@/screens/results/ui/ResultsScreen";
import { getSupabaseServer } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const supabase = getSupabaseServer();

  const submission = await getSubmissionDetail(supabaseSubmissionDetailDb(supabase), submissionId);
  const characters = submission.characterResults.map((r) => r.character);
  const historyMatrix = await getCharacterHistory(supabaseCharacterHistoryDb(supabase), characters);

  return <ResultsScreen submission={submission} historyMatrix={historyMatrix} />;
}
