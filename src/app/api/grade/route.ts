import { NextResponse, type NextRequest } from "next/server";

import { gradeWithGemini } from "@/entities/submission/api/gradeWithGemini";
import {
  getSubmissionForGrading,
  supabaseGradingDb,
} from "@/entities/submission/api/getSubmissionForGrading";
import { mapGradeError } from "@/entities/submission/api/mapGradeError";
import { saveGradingResult, supabaseCharacterResultsDb } from "@/entities/submission/api/saveGradingResult";
import { getGeminiClient } from "@/shared/lib/gemini/client";
import { getSupabaseServer } from "@/shared/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const submissionId = body.submissionId;

  if (typeof submissionId !== "string" || !submissionId) {
    return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
  }

  const supabaseServer = getSupabaseServer();

  try {
    const { imageUrl, vocabList } = await getSubmissionForGrading(
      supabaseGradingDb(supabaseServer),
      submissionId,
    );

    const imageResponse = await fetch(imageUrl);
    const imageBase64 = Buffer.from(await imageResponse.arrayBuffer()).toString("base64");

    const grade = await gradeWithGemini(getGeminiClient(), { imageBase64, vocabList });

    await saveGradingResult(supabaseCharacterResultsDb(supabaseServer), submissionId, grade);

    return NextResponse.json({
      submissionId,
      score: grade.score,
      totalPossible: grade.totalPossible,
      results: grade.results,
    });
  } catch (error) {
    const { message, status } = mapGradeError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
