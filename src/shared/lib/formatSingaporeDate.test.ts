import { describe, expect, test } from "vitest";

import { formatSingaporeDate } from "./formatSingaporeDate";

describe("formatSingaporeDate", () => {
  test("pins Asia/Singapore for the calendar day, regardless of the caller's options", () => {
    // Midnight UTC on 30 Nov is already 30 Nov in Singapore (UTC+8) - but
    // would read as 29 Nov under a server whose ambient timezone is behind
    // UTC (e.g. any US timezone), which is exactly the bug this exists to
    // prevent - "en-SG" alone does not pin the timezone, only the locale.
    const midnightUtc = new Date("2026-11-30T00:00:00Z");

    expect(
      formatSingaporeDate(midnightUtc, { day: "numeric", month: "short", year: "numeric" }),
    ).toBe("30 Nov 2026");
  });
});
