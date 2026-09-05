"use client";

import { PrintWorksheetButton } from "@/features/print-worksheet/ui/PrintWorksheetButton";
import type { Lesson } from "@/entities/lesson/model/types";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

import { getStatusLabel } from "../model/getStatusLabel";

const STATUS_VARIANT: Record<Lesson["status"], "warning" | "success" | "destructive"> = {
  pending: "warning",
  completed: "success",
  needs_revision: "destructive",
};

type LessonCardProps = {
  lesson: Lesson;
  expanded: boolean;
  onToggle: () => void;
};

export function LessonCard({ lesson, expanded, onToggle }: LessonCardProps) {
  return (
    <Card>
      <CardHeader className="p-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="w-full cursor-pointer rounded-t-xl px-(--card-spacing) pt-2 pb-(--card-spacing) text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <CardTitle className="flex items-start justify-between gap-2 text-sm">
            <span>
              <span className="text-primary">Week {lesson.weekNumber}</span>
              <br />
              <span className="text-base font-medium">《{lesson.title}》</span>
            </span>
            <Badge variant={STATUS_VARIANT[lesson.status]}>{getStatusLabel(lesson)}</Badge>
          </CardTitle>
        </button>
      </CardHeader>

      {/* CSS-only expand/collapse (grid-template-rows 0fr -> 1fr) so content
          isn't just there-or-gone — one deliberate motion moment, skipped
          entirely under prefers-reduced-motion via motion-safe:. */}
      <div
        className={cn(
          "grid motion-safe:transition-[grid-template-rows] motion-safe:duration-300 motion-safe:ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              {lesson.vocabulary.map((entry) => (
                <div key={entry.character} className="rounded-lg bg-muted p-2 text-center">
                  <p className="text-lg font-medium">{entry.character}</p>
                  <p className="text-xs text-muted-foreground">{entry.pinyin}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border" />
            <PrintWorksheetButton lesson={lesson} />
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
