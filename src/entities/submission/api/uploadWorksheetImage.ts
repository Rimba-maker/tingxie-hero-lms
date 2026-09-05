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
      // Fixed, not file.type: the only real capture path (canvas.toBlob in
      // useCameraCapture) always produces image/jpeg, and the stored
      // content-type is what the public bucket serves the object back as —
      // trusting the client-declared MIME here would let a spoofed
      // Content-Type (e.g. image/svg+xml) get served as-is from a public
      // URL. validateWorksheetImage's image/* check doesn't rule that out.
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: "image/jpeg",
      });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return { publicUrl: data.publicUrl };
    },
  };
}
