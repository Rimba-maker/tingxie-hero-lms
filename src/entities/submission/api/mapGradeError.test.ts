import { describe, expect, it } from "vitest";

import { GeminiGradingError, SubmissionNotFoundError } from "./gradingErrors";
import { mapGradeError } from "./mapGradeError";

describe("mapGradeError", () => {
  it("maps a SubmissionNotFoundError to 404", () => {
    expect(mapGradeError(new SubmissionNotFoundError("abc-123"))).toEqual({
      message: "Submission not found: abc-123",
      status: 404,
    });
  });

  it("maps a GeminiGradingError to 502 with the original message", () => {
    expect(mapGradeError(new GeminiGradingError("Gemini blocked this image: SAFETY"))).toEqual({
      message: "Gemini blocked this image: SAFETY",
      status: 502,
    });
  });

  it("maps a plain Error carrying the same text to a generic 500 — type is what's matched, not the message", () => {
    expect(mapGradeError(new Error("Submission not found: abc-123"))).toEqual({
      message: "Grading failed, please try again",
      status: 500,
    });
  });

  it("maps an unexpected error to a generic 500", () => {
    expect(mapGradeError(new Error("connection reset"))).toEqual({
      message: "Grading failed, please try again",
      status: 500,
    });
  });

  it("maps a non-Error throw to a generic 500", () => {
    expect(mapGradeError("boom")).toEqual({
      message: "Grading failed, please try again",
      status: 500,
    });
  });
});
