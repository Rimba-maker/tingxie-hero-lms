import type { CalendarDay } from "@/shared/lib/getCurrentWeekDays";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

type WeeklyCalendarStripProps = {
  days: CalendarDay[];
};

export function WeeklyCalendarStrip({ days }: WeeklyCalendarStripProps) {
  return (
    <Card>
      <CardContent className="flex justify-between">
        {days.map((day) => (
          <div key={day.label} className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">{day.label}</span>
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm",
                day.isToday && "bg-accent font-medium text-primary ring-1 ring-primary/30",
              )}
            >
              {day.date}
            </span>
            {day.hasEvent && <span className="size-1 rounded-full bg-primary" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
