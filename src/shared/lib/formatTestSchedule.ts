import { SINGAPORE_TIME_ZONE } from "./formatSingaporeDate";

export function formatTestSchedule(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SINGAPORE_TIME_ZONE,
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
