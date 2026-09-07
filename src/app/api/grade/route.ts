import { NextResponse, type NextRequest } from "next/server";

import { fetchImageAsBase64, gradeSubmission } from "@/entities/submission/api/gradeSubmission";
import { supabaseGradingDb } from "@/entities/submission/api/getSubmissionForGrading";
import { mapGradeError } from "@/entities/submission/api/mapGradeError";
import { supabaseCharacterResultsDb } from "@/entities/submission/api/saveGradingResult";
import { getGeminiClient } from "@/shared/lib/gemini/client";
import { getSupabaseServer } from "@/shared/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Confirmed live: a malformed body (or none at all) makes request.json()
  // throw a SyntaxError. Left unguarded, that propagates as an unhandled
  // rejection Next.js turns into an empty 500 - breaking this route's own
  // { error: string } contract that every other failure path here honors.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const submissionId = (body as { submissionId?: unknown })?.submissionId;

  if (typeof submissionId !== "string" || !submissionId) {
    return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
  }

  const supabaseServer = getSupabaseServer();

  try {
    const result = await gradeSubmission(
      {
        gradingDb: supabaseGradingDb(supabaseServer),
        resultsDb: supabaseCharacterResultsDb(supabaseServer),
        gemini: getGeminiClient(),
        fetchImageAsBase64,
      },
      submissionId,
    );
    return NextResponse.json(result);
  } catch (error) {
    const { message, status } = mapGradeError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
