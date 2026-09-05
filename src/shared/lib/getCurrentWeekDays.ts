export type CalendarDay = {
  label: string;
  date: number;
  isToday: boolean;
  hasEvent: boolean;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Mon-Sat of the week containing `today` (Sunday rolls forward into the
// upcoming week, not back into the one that just ended — there's no Sunday
// column to show it in otherwise). `eventDate`, when given, marks the
// matching day with hasEvent if it falls within the displayed week.
export function getCurrentWeekDays(today: Date, eventDate: Date | null = null): CalendarDay[] {
  const monday = new Date(today);
  monday.setDate(today.getDate() + (1 - today.getDay()));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 6 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return {
      label: WEEKDAY_LABELS[day.getDay()],
      date: day.getDate(),
      isToday: isSameDate(day, today),
      hasEvent: eventDate !== null && isSameDate(day, eventDate),
    };
  });
}
