// Narrow, single-purpose interface — easier to fake in tests than the full
// chainable SupabaseClient query builder. The real implementation (wiring
// this to `supabaseServer`) lives at the API route composition root.
export type SubmissionsDb = {
  insertSubmission(params: { lessonId: string; imageUrl: string }): Promise<{ id: string }>;
};

export async function createSubmission(
  db: SubmissionsDb,
  params: { lessonId: string; imageUrl: string },
): Promise<{ id: string }> {
  return db.insertSubmission(params);
}
