"use client";

import { Bell } from "lucide-react";

import type { Lesson } from "@/entities/lesson/model/types";
import { useExpandLesson } from "@/features/expand-lesson/model/useExpandLesson";
import { MOE_LEVELS, useLevelTab, type MoeLevel } from "@/features/select-level-tab/model/useLevelTab";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav";
import { LessonCard } from "@/widgets/lesson-card/ui/LessonCard";

type SyllabusScreenProps = {
  studentName: string;
  moeLevel: MoeLevel;
  lessons: Lesson[];
};

export function SyllabusScreen({ studentName, moeLevel, lessons }: SyllabusScreenProps) {
  const { level, setLevel } = useLevelTab(moeLevel);
  const { isExpanded, toggle } = useExpandLesson(lessons.map((lesson) => lesson.id));

  const lessonsForLevel = lessons.filter((lesson) => lesson.moeLevel === level);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <p className="font-semibold">{studentName}</p>
        </div>
        <Bell className="size-5 text-muted-foreground" />
      </div>

      <Tabs value={level} onValueChange={(value) => setLevel(value as MoeLevel)}>
        <TabsList>
          {MOE_LEVELS.map((l) => (
            <TabsTrigger key={l} value={l}>
              {l}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">MOE {level} Syllabus</span>
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
