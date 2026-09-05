import Link from "next/link";
import { Bell, Camera } from "lucide-react";

import type { Lesson } from "@/entities/lesson/model/types";
import type { StudentCredits } from "@/entities/student/model/types";
import { formatTestSchedule } from "@/shared/lib/formatTestSchedule";
import { getCurrentWeekDays } from "@/shared/lib/getCurrentWeekDays";
import { buttonVariants } from "@/shared/ui/button";
import type { Viewer } from "@/widgets/app-header/model/types";
import { CreditsCard } from "@/widgets/credits-card/ui/CreditsCard";
import { MasteryStats } from "@/widgets/mastery-stats/ui/MasteryStats";
import { ScreenShell } from "@/widgets/screen-shell/ui/ScreenShell";
import { WeeklyCalendarStrip } from "@/widgets/weekly-calendar-strip/ui/WeeklyCalendarStrip";

type DashboardScreenProps = {
  viewer: Viewer;
  credits: StudentCredits;
  upcomingLesson: Lesson | null;
};

// Mastery rate / characters-practiced stats are hardcoded — the assignment's
// Technical Requirements section never mentions them (only the mockup image
// does), so unlike the credits card and calendar strip below, there's no
// requirement to back them with real data.
export function DashboardScreen({ viewer, credits, upcomingLesson }: DashboardScreenProps) {
  const testDate = upcomingLesson?.testScheduledAt ? new Date(upcomingLesson.testScheduledAt) : null;
  const calendarDays = getCurrentWeekDays(new Date(), testDate);

  return (
    <ScreenShell viewer={viewer}>

      <CreditsCard
        used={credits.used}
        total={credits.total}
        expiresOn={new Date(credits.expiresOn).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      />

      <MasteryStats
        masteryRatePercent={82.4}
        masteryRateDeltaThisMonth={3.1}
        charactersPracticed={48}
        listsCovered={8}
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Upcoming Ting Xie</span>
          <Link href="/syllabus" className="text-xs font-medium text-primary">
            View All
          </Link>
        </div>
        <WeeklyCalendarStrip days={calendarDays} />
      </div>

      {upcomingLesson && (
        <div className="flex items-center gap-3 rounded-r-xl rounded-l-sm border-l-4 border-primary bg-accent p-4">
          <Bell className="size-4 shrink-0 text-primary" />
          <p className="text-sm">
            Week {upcomingLesson.weekNumber}: <span className="font-medium">《{upcomingLesson.title}》</span>{" "}
            Spelling Test
            <br />
            <span className="text-muted-foreground">
              {testDate ? formatTestSchedule(testDate) : "Date to be scheduled"} · {upcomingLesson.moeLevel}{" "}
              MOE Syllabus
            </span>
          </p>
        </div>
      )}

      <Link
        href={upcomingLesson ? `/scan?lessonId=${upcomingLesson.id}` : "/scan"}
        className={buttonVariants({ size: "lg", className: "self-center px-6 text-base [&_svg:not([class*='size-'])]:size-5" })}
      >
        <Camera data-icon="inline-start" />
        Scan &amp; Grade Worksheet
      </Link>
    </ScreenShell>
  );
}
