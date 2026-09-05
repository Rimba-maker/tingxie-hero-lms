import { describe, expect, it } from "vitest";

import type { Lesson } from "@/entities/lesson/model/types";

import { getStatusLabel } from "./getStatusLabel";

function makeLesson(overrides: Partial<Lesson>): Lesson {
  return {
    id: "lesson-1",
    weekNumber: 1,
    title: "Test",
    moeLevel: "P2",
    status: "pending",
    vocabulary: [],
    testScheduledAt: null,
    latestScore: null,
    ...overrides,
  };
}

describe("getStatusLabel", () => {
  it('labels a pending lesson "Pending Practice"', () => {
    expect(getStatusLabel(makeLesson({ status: "pending" }))).toBe("Pending Practice");
  });

  it('labels a needs_revision lesson "Needs Revision"', () => {
    expect(getStatusLabel(makeLesson({ status: "needs_revision" }))).toBe("Needs Revision");
  });

  it("shows the real computed percentage from the lesson's latest submission when completed", () => {
    const lesson = makeLesson({
      status: "completed",
      latestScore: { score: 8, totalPossible: 10 },
    });
    expect(getStatusLabel(lesson)).toBe("Completed (80%)");
  });

  it("rounds the percentage rather than truncating", () => {
    const lesson = makeLesson({
      status: "completed",
      latestScore: { score: 2, totalPossible: 3 },
    });
    expect(getStatusLabel(lesson)).toBe("Completed (67%)");
  });

  it('falls back to plain "Completed" when no graded submission exists yet', () => {
    expect(getStatusLabel(makeLesson({ status: "completed", latestScore: null }))).toBe("Completed");
  });
});
