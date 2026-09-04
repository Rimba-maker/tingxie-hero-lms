export type SubmissionForGradingDb = {
  findSubmissionForGrading(
    submissionId: string,
  ): Promise<{ imageUrl: string; vocabList: string[] } | null>;
};

export async function getSubmissionForGrading(
  db: SubmissionForGradingDb,
  submissionId: string,
): Promise<{ imageUrl: string; vocabList: string[] }> {
  const result = await db.findSubmissionForGrading(submissionId);
  if (!result) {
    throw new Error(`Submission not found: ${submissionId}`);
  }
  return result;
}
