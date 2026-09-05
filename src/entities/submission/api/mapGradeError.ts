import { GeminiGradingError, SubmissionNotFoundError } from "./gradingErrors";

// The grade route's own error-to-response mapping — pulled out of the route
// handler so the branching (which failure gets which status code) is
// testable without mocking NextRequest. Matches by type, not by
// string-prefixing error.message: a renamed thrown message used to be able
// to silently degrade the HTTP status to a generic 500 with no compile
// error, since nothing enforced the string convention between throw sites
// and this mapper.
export function mapGradeError(error: unknown): { message: string; status: number } {
  if (error instanceof SubmissionNotFoundError) {
    return { message: error.message, status: 404 };
  }
  if (error instanceof GeminiGradingError) {
    return { message: error.message, status: 502 };
  }
  return { message: "Grading failed, please try again", status: 500 };
}
