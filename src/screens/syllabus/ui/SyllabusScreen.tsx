"use client";

import { useState } from "react";

import type { Lesson } from "@/entities/lesson/model/types";
import { pluralize } from "@/shared/lib/pluralize";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AppHeader } from "@/widgets/app-header/ui/AppHeader";
import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav";
import { LessonCard } from "@/widgets/lesson-card/ui/LessonCard";

const MOE_LEVELS = ["P1", "P2", "P3", "P4", "P5", "P6"] as const;
type MoeLevel = (typeof MOE_LEVELS)[number];

const LEVEL_FULL_NAME: Record<MoeLevel, string> = {
  P1: "Primary 1",
  P2: "Primary 2",
  P3: "Primary 3",
  P4: "Primary 4",
  P5: "Primary 5",
  P6: "Primary 6",
};

type SyllabusScreenProps = {
  parentName: string;
  studentName: string;
  moeLevel: MoeLevel;
  lessons: Lesson[];
};

export function SyllabusScreen({ parentName, studentName, moeLevel, lessons }: SyllabusScreenProps) {
  const [level, setLevel] = useState<MoeLevel>(moeLevel);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(lessons.map((lesson) => lesson.id)),
  );

  function toggleExpanded(lessonId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  }

  const lessonsForLevel = lessons.filter((lesson) => lesson.moeLevel === level);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24">
      <AppHeader parentName={parentName} studentName={studentName} moeLevel={moeLevel} />

      <Tabs value={level} onValueChange={(value) => setLevel(value as MoeLevel)}>
        <TabsList className="mx-auto h-auto gap-2 bg-transparent p-0">
          {MOE_LEVELS.map((l) => (
            <TabsTrigger
              key={l}
              value={l}
              className="rounded-full border-none bg-card px-4 py-1.5 text-muted-foreground ring-1 ring-foreground/10 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none data-active:ring-0"
            >
              {l}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">MOE {LEVEL_FULL_NAME[level]} Syllabus</span>
        <span className="text-xs text-muted-foreground">
          {lessonsForLevel.length} {pluralize(lessonsForLevel.length, "Lesson")} Total
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {lessonsForLevel.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            expanded={expandedIds.has(lesson.id)}
            onToggle={() => toggleExpanded(lesson.id)}
          />
        ))}
        {lessonsForLevel.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No lessons for {level} yet.
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
