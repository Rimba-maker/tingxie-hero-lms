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
