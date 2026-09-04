import { describe, expect, test } from "vitest";

import { listSubmissionHistory, type SubmissionHistoryDb } from "./listSubmissionHistory";

describe("listSubmissionHistory", () => {
  test("returns graded submissions newest first, as given by the db", async () => {
    const fakeDb: SubmissionHistoryDb = {
      findGradedSubmissions: async () => [
        {
          id: "sub-2",
          submittedAt: "2026-10-14T15:12:00Z",
          lessonWeekNumber: 4,
          lessonTitle: "第十课 – 我们的校园",
          score: 8,
          totalPossible: 10,
        },
        {
          id: "sub-1",
          submittedAt: "2026-10-10T09:00:00Z",
          lessonWeekNumber: 3,
          lessonTitle: "第九课 – 我爱我的家",
          score: 10,
          totalPossible: 10,
        },
      ],
    };

    const result = await listSubmissionHistory(fakeDb);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("sub-2");
  });

  test("returns an empty list when nothing has been graded yet", async () => {
    const fakeDb: SubmissionHistoryDb = {
      findGradedSubmissions: async () => [],
    };

    const result = await listSubmissionHistory(fakeDb);

    expect(result).toEqual([]);
  });
});
