import { describe, expect, test } from "vitest";

import { topUpCredits, TOP_UP_AMOUNT, type TopUpCreditsDb } from "./topUpCredits";

describe("topUpCredits", () => {
  test("increments the student's credit total by the fixed top-up amount", async () => {
    const calls: { studentId: string; amount: number }[] = [];
    const fakeDb: TopUpCreditsDb = {
      incrementCreditsTotal: async (studentId, amount) => {
        calls.push({ studentId, amount });
        return { creditsTotal: 30 };
      },
    };

    const result = await topUpCredits(fakeDb, "lucas-p2");

    expect(calls).toEqual([{ studentId: "lucas-p2", amount: TOP_UP_AMOUNT }]);
    expect(result).toEqual({ creditsTotal: 30 });
  });
});
