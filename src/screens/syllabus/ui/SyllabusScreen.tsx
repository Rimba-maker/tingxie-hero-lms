"use client";

import type { Lesson } from "@/entities/lesson/model/types";
import { useExpandLesson } from "@/features/expand-lesson/model/useExpandLesson";
import { MOE_LEVELS, useLevelTab, type MoeLevel } from "@/features/select-level-tab/model/useLevelTab";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AppHeader } from "@/widgets/app-header/ui/AppHeader";
import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav";
import { LessonCard } from "@/widgets/lesson-card/ui/LessonCard";

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
  const { level, setLevel } = useLevelTab(moeLevel);
  const { isExpanded, toggle } = useExpandLesson(lessons.map((lesson) => lesson.id));

  const lessonsForLevel = lessons.filter((lesson) => lesson.moeLevel === level);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24">
      <AppHeader parentName={parentName} studentName={studentName} moeLevel={moeLevel} />

      <Tabs value={level} onValueChange={(value) => setLevel(value as MoeLevel)}>
        <TabsList className="h-auto justify-center gap-1.5 bg-transparent p-0">
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
        <span className="text-xs text-muted-foreground">{lessonsForLevel.length} Lessons Total</span>
      </div>

      <div className="flex flex-col gap-3">
        {lessonsForLevel.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            expanded={isExpanded(lesson.id)}
            onToggle={() => toggle(lesson.id)}
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
