"use client";

import { useState } from "react";

import type { Lesson } from "@/entities/lesson/model/types";
import { pluralize } from "@/shared/lib/pluralize";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { Viewer } from "@/widgets/app-header/model/types";
import { LessonCard } from "@/widgets/lesson-card/ui/LessonCard";
import { ScreenShell } from "@/widgets/screen-shell/ui/ScreenShell";

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
  viewer: Viewer;
  moeLevel: MoeLevel;
  lessons: Lesson[];
};

export function SyllabusScreen({ viewer, moeLevel, lessons }: SyllabusScreenProps) {
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
    <ScreenShell viewer={viewer}>
      {/* Confirmed live on a real device profile (iPhone SE, 320px - the
          narrowest common iOS width): 6 fixed-width pills never fit, and
          with nothing containing that overflow it widened the *entire
          page*, not just this row - BottomNav included. overflow-x-auto
          scopes the overflow to just this strip; mx-auto on TabsList still
          centers it normally on every width wide enough to not need to
          scroll at all. */}
      <Tabs value={level} onValueChange={(value) => setLevel(value as MoeLevel)}>
        <div className="overflow-x-auto">
          <TabsList className="mx-auto h-auto gap-2 bg-transparent p-0">
            {MOE_LEVELS.map((l) => (
              <TabsTrigger
                key={l}
                value={l}
                // h-11 (44px) explicitly, not just more padding: the base
                // TabsTrigger sets h-[calc(100%-1px)], an explicit height
                // that (border-box) padding can't grow on its own -
                // confirmed live, py-3 alone measured no change at all.
                // Smallest deliberate deviation from the mockup's original
                // sizing that reaches Apple/Google's 44px tap-target
                // guideline; safe to grow since each tab already has gap-2
                // clearance from its neighbors (no new overlap risk).
                className="h-11 rounded-full border-none bg-card px-4 text-muted-foreground ring-1 ring-foreground/10 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none data-active:ring-0"
              >
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium">MOE {LEVEL_FULL_NAME[level]} Syllabus</h1>
        <span className="text-xs text-muted-foreground">
          {lessonsForLevel.length} {pluralize(lessonsForLevel.length, "Lesson")} Total
        </span>
      </div>

      {/* md:grid, not just a wider flex-col: at tablet width a single
          stretched column means scrolling past lessons that would fit
          side by side. items-start (not the grid default stretch) keeps
          one lesson's expand/collapse from stretching its neighbor. */}
      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:items-start md:gap-4">
        {lessonsForLevel.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            expanded={expandedIds.has(lesson.id)}
            onToggle={() => toggleExpanded(lesson.id)}
          />
        ))}
        {lessonsForLevel.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground md:col-span-2">
            No lessons for {level} yet.
          </p>
        )}
      </div>
    </ScreenShell>
  );
}
