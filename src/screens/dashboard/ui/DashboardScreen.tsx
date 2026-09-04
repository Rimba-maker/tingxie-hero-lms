import Link from "next/link";
import { Bell, Camera } from "lucide-react";

import type { Lesson } from "@/entities/lesson/model/types";
import { Button } from "@/shared/ui/button";
import { CreditsCard } from "@/widgets/credits-card/ui/CreditsCard";
import { MasteryStats } from "@/widgets/mastery-stats/ui/MasteryStats";
import { WeeklyCalendarStrip } from "@/widgets/weekly-calendar-strip/ui/WeeklyCalendarStrip";
import { BottomNav } from "@/widgets/bottom-nav/ui/BottomNav";

type DashboardScreenProps = {
  studentName: string;
  moeLevel: string;
  upcomingLesson: Lesson | null;
};

// Stats below are hardcoded per FSD_TingXieHero.md Phase 4 ("Dashboard
// screen — hardcoded/derived stats") — this assignment has no auth/history
// aggregation in scope, only the upcoming-lesson banner and CTA link are
// derived from real lesson data.
const CALENDAR_DAYS = [
  { label: "Mon", date: 12 },
  { label: "Tue", date: 13 },
  { label: "Wed", date: 14, hasEvent: true },
  { label: "Thu", date: 15 },
  { label: "Fri", date: 16 },
  { label: "Sat", date: 17 },
];

export function DashboardScreen({ studentName, moeLevel, upcomingLesson }: DashboardScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <p className="font-semibold">{studentName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
            Lucas — {moeLevel}
          </span>
          <Bell className="size-5 text-muted-foreground" />
        </div>
      </div>

      <CreditsCard used={12} total={20} expiresOn="30 Nov 2026" />

      <MasteryStats
        masteryRatePercent={82.4}
        masteryRateDeltaThisMonth={3.1}
        charactersPracticed={48}
        listsCovered={8}
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Upcoming Ting Xie</span>
          <Link href="/syllabus" className="text-xs text-primary">
            View All
          </Link>
        </div>
        <WeeklyCalendarStrip days={CALENDAR_DAYS} selectedDate={14} />
      </div>

      {upcomingLesson && (
        <div className="flex items-center gap-3 rounded-xl bg-accent p-4">
          <Bell className="size-4 shrink-0 text-primary" />
          <p className="text-sm">
            Week {upcomingLesson.weekNumber}: <span className="font-medium">{upcomingLesson.title}</span> Spelling
            Test
            <br />
            <span className="text-muted-foreground">
              Wednesday, 14 Oct at 3:00 PM · {upcomingLesson.moeLevel} MOE Syllabus
            </span>
          </p>
        </div>
      )}

      <Button
        render={<Link href={upcomingLesson ? `/scan?lessonId=${upcomingLesson.id}` : "/scan"} />}
        nativeButton={false}
        size="lg"
        className="w-full"
      >
        <Camera data-icon="inline-start" />
        Scan &amp; Grade Worksheet
      </Button>

      <BottomNav />
    </div>
  );
}
