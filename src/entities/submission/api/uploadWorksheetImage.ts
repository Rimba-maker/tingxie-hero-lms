import type { SupabaseClient } from "@supabase/supabase-js";

export type WorksheetImageStorage = {
  upload(path: string, file: Blob, contentType: string): Promise<{ publicUrl: string }>;
};

export async function uploadWorksheetImage(
  storage: WorksheetImageStorage,
  params: { file: Blob; path: string; contentType: string },
): Promise<{ imageUrl: string }> {
  const { publicUrl } = await storage.upload(params.path, params.file, params.contentType);
  return { imageUrl: publicUrl };
}

const BUCKET = "worksheet-photos";

// Real Supabase Storage-backed implementation. Untested glue.
export function supabaseWorksheetImageStorage(supabase: SupabaseClient): WorksheetImageStorage {
  return {
    async upload(path, file, contentType) {
      // contentType is the caller's validated file.type (validateWorksheetImage
      // already narrowed it to a small raster allowlist before this ever
      // runs), not a blind pass-through of client input — the stored
      // content-type is what the public bucket serves the object back as,
      // and what gradeSubmission later tells Gemini this file actually is.
      // Previously hardcoded to "image/jpeg" on the assumption that was the
      // only real capture path; ImageCapture.takePhoto() (the *preferred*
      // path, tried first) isn't guaranteed to produce JPEG (confirmed via
      // MDN) - a device that returns PNG there was being mislabeled.
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return { publicUrl: data.publicUrl };
    },
  };
}
