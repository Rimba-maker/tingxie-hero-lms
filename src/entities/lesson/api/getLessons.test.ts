import { describe, expect, test } from "vitest";

import { getLessons, type LessonsDb } from "./getLessons";

describe("getLessons", () => {
  test("maps snake_case DB rows to camelCase Lesson domain objects", async () => {
    const fakeDb: LessonsDb = {
      listLessons: async () => [
        {
          id: "lesson-1",
          week_number: 4,
          title: "第十课 – 我们的校园",
          moe_level: "P2",
          status: "pending",
          vocabulary: [
            { character: "校园", pinyin: "xiào yuán" },
            { character: "礼堂", pinyin: "lǐ táng" },
          ],
          test_scheduled_at: "2026-10-14T15:00:00Z",
        },
      ],
    };

    const result = await getLessons(fakeDb);

    expect(result).toEqual([
      {
        id: "lesson-1",
        weekNumber: 4,
        title: "第十课 – 我们的校园",
        moeLevel: "P2",
        status: "pending",
        vocabulary: [
          { character: "校园", pinyin: "xiào yuán" },
          { character: "礼堂", pinyin: "lǐ táng" },
        ],
        testScheduledAt: "2026-10-14T15:00:00Z",
      },
    ]);
  });

  test("testScheduledAt is null when the DB column is null", async () => {
    const fakeDb: LessonsDb = {
      listLessons: async () => [
        {
          id: "lesson-2",
          week_number: 3,
          title: "第九课",
          moe_level: "P2",
          status: "completed",
          vocabulary: [],
          test_scheduled_at: null,
        },
      ],
    };

    const result = await getLessons(fakeDb);

    expect(result[0].testScheduledAt).toBeNull();
  });
});
