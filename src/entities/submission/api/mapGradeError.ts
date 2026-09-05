// The grade route's own error-to-response mapping — pulled out of the route
// handler so the branching (which failure gets which status code) is
// testable without mocking NextRequest.
export function mapGradeError(error: unknown): { message: string; status: number } {
  const message = error instanceof Error ? error.message : "";

  if (message.startsWith("Submission not found")) {
    return { message, status: 404 };
  }
  if (message.startsWith("Gemini")) {
    return { message, status: 502 };
  }
  return { message: "Grading failed, please try again", status: 500 };
}
