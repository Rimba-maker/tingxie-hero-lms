import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

type CalendarDay = {
  label: string;
  date: number;
  hasEvent?: boolean;
};

type WeeklyCalendarStripProps = {
  days: CalendarDay[];
  selectedDate: number;
};

export function WeeklyCalendarStrip({ days, selectedDate }: WeeklyCalendarStripProps) {
  return (
    <Card>
      <CardContent className="flex justify-between">
        {days.map((day) => {
          const isSelected = day.date === selectedDate;
          return (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{day.label}</span>
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm",
                  isSelected && "bg-accent font-medium text-primary ring-1 ring-primary/30",
                )}
              >
                {day.date}
              </span>
              {day.hasEvent && <span className="size-1 rounded-full bg-primary" />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
