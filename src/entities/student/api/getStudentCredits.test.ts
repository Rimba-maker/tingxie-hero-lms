import { describe, expect, test } from "vitest";

import { getStudentCredits, type StudentCreditsDb } from "./getStudentCredits";

describe("getStudentCredits", () => {
  test("used is derived from the student's actual submission count, not a stored counter", () => {
    const fakeDb: StudentCreditsDb = {
      findStudentCredits: async () => ({
        creditsTotal: 20,
        creditsExpireAt: "2026-11-30T00:00:00Z",
        submissionsCount: 8,
      }),
    };

    return getStudentCredits(fakeDb, "lucas-p2").then((result) => {
      expect(result).toEqual({ total: 20, used: 8, expiresOn: "2026-11-30T00:00:00Z" });
    });
  });

  test("throws a clear error when the student doesn't exist", async () => {
    const fakeDb: StudentCreditsDb = { findStudentCredits: async () => null };

    await expect(getStudentCredits(fakeDb, "missing")).rejects.toThrow("Student not found: missing");
  });
});
