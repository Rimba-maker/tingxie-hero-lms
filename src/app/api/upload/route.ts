import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { createSubmission, supabaseSubmissionsDb } from "@/entities/submission/api/createSubmission";
import {
  supabaseWorksheetImageStorage,
  uploadWorksheetImage,
} from "@/entities/submission/api/uploadWorksheetImage";
import { getSupabaseServer } from "@/shared/lib/supabase/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("image");
  const lessonId = formData.get("lessonId");

  if (!(file instanceof Blob) || typeof lessonId !== "string" || !lessonId) {
    return NextResponse.json({ error: "image and lessonId are required" }, { status: 400 });
  }

  const supabaseServer = getSupabaseServer();

  const { imageUrl } = await uploadWorksheetImage(supabaseWorksheetImageStorage(supabaseServer), {
    file,
    path: `${randomUUID()}.jpg`,
  });

  const submission = await createSubmission(supabaseSubmissionsDb(supabaseServer), {
    lessonId,
    imageUrl,
  });

  return NextResponse.json({ submissionId: submission.id, status: "pending" });
}
