import { describe, expect, test } from "vitest";

import { getLatestSubmission, type LatestSubmissionDb } from "./getLatestSubmission";

describe("getLatestSubmission", () => {
  test("returns the most recent submission's id", async () => {
    const fakeDb: LatestSubmissionDb = {
      findLatestSubmissionId: async () => "sub-latest",
    };

    const result = await getLatestSubmission(fakeDb);

    expect(result).toEqual({ id: "sub-latest" });
  });

  test("returns null when there are no submissions yet", async () => {
    const fakeDb: LatestSubmissionDb = {
      findLatestSubmissionId: async () => null,
    };

    const result = await getLatestSubmission(fakeDb);

    expect(result).toBeNull();
  });
});
