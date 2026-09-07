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
      {/* Reverted an earlier overflow-x-auto attempt on direct feedback: it
          broke centering (mx-auto on an inline-flex child doesn't reliably
          center once nested in a separate scrolling block) and looked
          broken rather than intentionally scrollable (P6 sat half-cut at
          the edge with no affordance it was swipeable). All 6 levels are
          a fixed, known set (MOE Singapore's own P1-P6) - the real fix is
          making all 6 actually fit, not making the overflow scroll
          somewhere. px-3/gap-1.5 is the floor confirmed to fit the
          narrowest real width (320px, iPhone SE) with room to spare; from
          375px up (nearly every other real phone) there's enough room to
          widen back toward the reference mockup's own more oval pill
          shape (docs/reference/mockups/screen2-syllabus.png), so
          min-[375px]: steps padding/gap back up there - an ordinary
          breakpoint, not the rejected scroll-wrapper approach. h-11 (44px
          tap target) unaffected at every width - only the pill's width
          changes. */}
      <Tabs value={level} onValueChange={(value) => setLevel(value as MoeLevel)}>
        <TabsList className="mx-auto h-auto gap-1.5 bg-transparent p-0 min-[375px]:gap-2">
          {MOE_LEVELS.map((l) => (
            <TabsTrigger
              key={l}
              value={l}
              className="h-11 rounded-full border-none bg-card px-3 text-muted-foreground ring-1 ring-foreground/10 min-[375px]:px-4 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none data-active:ring-0"
            >
              {l}
            </TabsTrigger>
          ))}
        </TabsList>
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
