import type { SupabaseClient } from "@supabase/supabase-js";

export type WorksheetImageStorage = {
  upload(path: string, file: Blob): Promise<{ publicUrl: string }>;
};

export async function uploadWorksheetImage(
  storage: WorksheetImageStorage,
  params: { file: Blob; path: string },
): Promise<{ imageUrl: string }> {
  const { publicUrl } = await storage.upload(params.path, params.file);
  return { imageUrl: publicUrl };
}

const BUCKET = "worksheet-photos";

// Real Supabase Storage-backed implementation. Untested glue.
export function supabaseWorksheetImageStorage(supabase: SupabaseClient): WorksheetImageStorage {
  return {
    async upload(path, file) {
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || "image/jpeg",
      });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return { publicUrl: data.publicUrl };
    },
  };
}
