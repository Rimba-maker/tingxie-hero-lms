// MOE Singapore curriculum (see CONTEXT/PRD) — a test's scheduled time must
// display the same way regardless of where the server actually runs
// (dev machine, Vercel edge region, etc.), so the timezone is pinned rather
// than left to the host's ambient local time.
const TIME_ZONE = "Asia/Singapore";

export function formatTestSchedule(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";

  return `${get("weekday")}, ${get("day")} ${get("month")} at ${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
}
