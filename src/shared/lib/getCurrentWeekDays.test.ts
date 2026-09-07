import { describe, expect, it } from "vitest";

import { getCurrentWeekDays } from "./getCurrentWeekDays";

describe("getCurrentWeekDays", () => {
  it("returns Mon-Sat of the week containing a midweek reference date", () => {
    const wednesday = new Date(2026, 9, 14); // Wed 14 Oct 2026
    const days = getCurrentWeekDays(wednesday);

    expect(days.map((d) => ({ label: d.label, date: d.date }))).toEqual([
      { label: "Mon", date: 12 },
      { label: "Tue", date: 13 },
      { label: "Wed", date: 14 },
      { label: "Thu", date: 15 },
      { label: "Fri", date: 16 },
      { label: "Sat", date: 17 },
    ]);
  });

  it("marks the reference date as isToday and no other day", () => {
    const wednesday = new Date(2026, 9, 14);
    const days = getCurrentWeekDays(wednesday);

    expect(days.filter((d) => d.isToday)).toEqual([
      { label: "Wed", date: 14, isToday: true, hasEvent: false },
    ]);
  });

  it("rolls a Sunday reference date forward into the upcoming week, not the one that just ended", () => {
    const sunday = new Date(2026, 9, 18); // Sun 18 Oct 2026
    const days = getCurrentWeekDays(sunday);

    expect(days[0]).toMatchObject({ label: "Mon", date: 19 });
    expect(days.every((d) => !d.isToday)).toBe(true);
  });

  it("marks the day matching eventDate with hasEvent, when it falls in the displayed week", () => {
    const monday = new Date(2026, 9, 12);
    const eventDate = new Date(2026, 9, 14); // Wed, same week
    const days = getCurrentWeekDays(monday, eventDate);

    expect(days.find((d) => d.hasEvent)).toMatchObject({ label: "Wed", date: 14 });
  });

  it("has no hasEvent day when eventDate falls outside the displayed week", () => {
    const monday = new Date(2026, 9, 12);
    const eventDate = new Date(2026, 9, 30); // different week
    const days = getCurrentWeekDays(monday, eventDate);

    expect(days.every((d) => !d.hasEvent)).toBe(true);
  });

  it("resolves 'today' in Asia/Singapore time, not the server's ambient local timezone", () => {
    // formatTestSchedule already pins Asia/Singapore explicitly (FSD §6
    // Phase 7 - the exact same class of bug, caught once for the test
    // schedule banner but missed here). 2026-09-08T06:30:00Z is already
    // 14:30 on 8 Sept in Singapore (UTC+8) - but only 23:30 on 7 Sept in a
    // US-Pacific server (UTC-7), which plain Date getters would read as
    // "today" instead, on whatever machine happens to run this app.
    const instant = new Date("2026-09-08T06:30:00Z");
    const days = getCurrentWeekDays(instant);

    expect(days.filter((d) => d.isToday)).toEqual([
      { label: "Tue", date: 8, isToday: true, hasEvent: false },
    ]);
  });
});
