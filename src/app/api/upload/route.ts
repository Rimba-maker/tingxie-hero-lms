import { randomUUID } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { createSubmission, supabaseSubmissionsDb } from "@/entities/submission/api/createSubmission";
import {
  supabaseWorksheetImageStorage,
  uploadWorksheetImage,
} from "@/entities/submission/api/uploadWorksheetImage";
import { validateWorksheetImage } from "@/entities/submission/api/validateWorksheetImage";
import { getSupabaseServer } from "@/shared/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Same class of gap as /api/grade: a malformed multipart body makes
  // request.formData() throw, which left unguarded becomes an empty 500
  // instead of this route's own { error: string } contract. Confirmed live.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const file = formData.get("image");
  const lessonId = formData.get("lessonId");

  if (!(file instanceof Blob) || typeof lessonId !== "string" || !lessonId) {
    return NextResponse.json({ error: "image and lessonId are required" }, { status: 400 });
  }

  const validationError = validateWorksheetImage(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabaseServer = getSupabaseServer();
  const extension = file.type.split("/")[1];

  try {
    const { imageUrl } = await uploadWorksheetImage(supabaseWorksheetImageStorage(supabaseServer), {
      file,
      path: `${randomUUID()}.${extension}`,
      contentType: file.type,
    });

    const submission = await createSubmission(supabaseSubmissionsDb(supabaseServer), {
      lessonId,
      imageUrl,
    });

    return NextResponse.json({ submissionId: submission.id, status: "pending" });
  } catch {
    return NextResponse.json({ error: "Upload failed, please try again" }, { status: 500 });
  }
}
