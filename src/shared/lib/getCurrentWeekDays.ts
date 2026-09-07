export type CalendarDay = {
  label: string;
  date: number;
  isToday: boolean;
  hasEvent: boolean;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// MOE Singapore curriculum (see CONTEXT/PRD) - "today" and the displayed
// week must be Singapore's calendar day regardless of where the server
// process actually runs. formatTestSchedule already pins this explicitly
// (FSD §6 Phase 7); plain Date getters here would silently read the
// server's own local timezone instead - the same bug, just never caught
// for this function.
const TIME_ZONE = "Asia/Singapore";

function getSingaporeDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

// A Singapore calendar date, anchored at UTC midnight purely so later
// day-of-week/day-arithmetic (setUTCDate, getUTCDay) never re-introduces
// the server's own local timezone - this Date's UTC fields are the only
// ones ever read again after this point.
function toSingaporeAnchor(date: Date): Date {
  const { year, month, day } = getSingaporeDateParts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

// Mon-Sat of the week containing `today` (Sunday rolls forward into the
// upcoming week, not back into the one that just ended - there's no Sunday
// column to show it in otherwise). `eventDate`, when given, marks the
// matching day with hasEvent if it falls within the displayed week.
export function getCurrentWeekDays(today: Date, eventDate: Date | null = null): CalendarDay[] {
  const todaySG = toSingaporeAnchor(today);
  const eventSG = eventDate ? toSingaporeAnchor(eventDate) : null;

  const monday = new Date(todaySG);
  monday.setUTCDate(todaySG.getUTCDate() + (1 - todaySG.getUTCDay()));

  return Array.from({ length: 6 }, (_, i) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);
    return {
      label: WEEKDAY_LABELS[day.getUTCDay()],
      date: day.getUTCDate(),
      isToday: day.getTime() === todaySG.getTime(),
      hasEvent: eventSG !== null && day.getTime() === eventSG.getTime(),
    };
  });
}
