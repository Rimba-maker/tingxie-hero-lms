import { notFound } from "next/navigation";

import {
  getCharacterHistory,
  supabaseCharacterHistoryDb,
} from "@/entities/character-result/api/getCharacterHistory";
import { getSubmissionDetail, supabaseSubmissionDetailDb } from "@/entities/submission/api/getSubmissionDetail";
import { SubmissionNotFoundError } from "@/entities/submission/api/gradingErrors";
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

  // Next.js strips a Server Component error down to a generic digest before
  // it reaches error.tsx in production (confirmed live via a prod build) -
  // by the time it'd get there, there's no message or type left to branch
  // on. notFound() sidesteps that entirely: it's not treated as an
  // application error, so it reaches not-found.tsx intact.
  let submission;
  try {
    submission = await getSubmissionDetail(supabaseSubmissionDetailDb(supabase), submissionId);
  } catch (error) {
    if (error instanceof SubmissionNotFoundError) notFound();
    throw error;
  }

  const characters = submission.characterResults.map((r) => r.character);
  const historyMatrix = await getCharacterHistory(supabaseCharacterHistoryDb(supabase), characters);

  return <ResultsScreen submission={submission} historyMatrix={historyMatrix} />;
}
