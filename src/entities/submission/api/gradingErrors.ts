// Named failure modes for the grading pipeline, matched by `instanceof` in
// mapGradeError — not by string-prefixing `error.message`. The old
// convention meant renaming a thrown message even slightly would silently
// degrade the HTTP status to a generic 500, with no compile error and no
// test catching the drift (mapGradeError's own tests hardcoded the exact
// strings, which hid the coupling rather than catching it).
export class SubmissionNotFoundError extends Error {
  constructor(submissionId: string) {
    super(`Submission not found: ${submissionId}`);
    this.name = "SubmissionNotFoundError";
  }
}

export class GeminiGradingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiGradingError";
  }
}
