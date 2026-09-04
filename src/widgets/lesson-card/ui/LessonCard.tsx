"use client";

import { ChevronDown, Printer } from "lucide-react";

import type { Lesson } from "@/entities/lesson/model/types";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

const STATUS_LABEL: Record<Lesson["status"], string> = {
  pending: "Pending Practice",
  completed: "Completed (80%)",
  needs_revision: "Needs Revision",
};

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
      <CardHeader
        className="cursor-pointer"
        onClick={onToggle}
        role="button"
        aria-expanded={expanded}
      >
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span>
            Week {lesson.weekNumber}
            <br />
            <span className="text-base font-medium">{lesson.title}</span>
          </span>
          <Badge variant={STATUS_VARIANT[lesson.status]}>{STATUS_LABEL[lesson.status]}</Badge>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            {lesson.vocabulary.map((entry) => (
              <div key={entry.character} className="rounded-lg bg-muted p-2 text-center">
                <p className="text-lg font-medium">{entry.character}</p>
                <p className="text-xs text-muted-foreground">{entry.pinyin}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="flex items-center justify-between text-sm text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <Printer className="size-4" />
              Print A4 Worksheet (PDF)
            </span>
            <ChevronDown className={cn("size-4 -rotate-90")} />
          </button>
        </CardContent>
      )}
    </Card>
  );
}
