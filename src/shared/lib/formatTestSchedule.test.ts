import { describe, expect, it } from "vitest";

import { formatTestSchedule } from "./formatTestSchedule";

describe("formatTestSchedule", () => {
  it('formats a UTC timestamp in Singapore time as "Weekday, D Mon at H:MM AM/PM", regardless of server-local timezone', () => {
    const date = new Date("2026-10-14T07:00:00Z"); // 3:00 PM in Asia/Singapore (UTC+8)
    expect(formatTestSchedule(date)).toBe("Wednesday, 14 Oct at 3:00 PM");
  });

  it("pads single-digit minutes", () => {
    const date = new Date("2026-10-14T01:05:00Z"); // 9:05 AM in Asia/Singapore
    expect(formatTestSchedule(date)).toBe("Wednesday, 14 Oct at 9:05 AM");
  });
});
