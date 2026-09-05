import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";

import type { SubmissionSummary } from "@/entities/submission/api/listSubmissionHistory";
import { Card, CardContent } from "@/shared/ui/card";
import { buttonVariants } from "@/shared/ui/button";
import type { Viewer } from "@/widgets/app-header/model/types";
import { ScreenShell } from "@/widgets/screen-shell/ui/ScreenShell";

type HistoryScreenProps = {
  viewer: Viewer;
  submissions: SubmissionSummary[];
};

export function HistoryScreen({ viewer, submissions }: HistoryScreenProps) {
  return (
    <ScreenShell viewer={viewer}>
      <h1 className="text-sm font-medium">Past Ting Xie Results</h1>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <ClipboardList className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">No results yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Scan a worksheet to see your first graded result here.
          </p>
          <Link href="/scan" className={buttonVariants({ className: "mt-1" })}>
            Scan &amp; Grade Worksheet
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map((submission) => {
            const percent =
              submission.score !== null
                ? Math.round((submission.score / submission.totalPossible) * 100)
                : null;
            const submittedDate = new Date(submission.submittedAt).toLocaleDateString("en-SG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <Link key={submission.id} href={`/results/${submission.id}`}>
                <Card>
                  <CardContent className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary text-xs font-semibold text-primary">
                      {percent}%
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {submission.lessonWeekNumber !== null
                          ? `Week ${submission.lessonWeekNumber}: 《${submission.lessonTitle}》`
                          : "Ting Xie Test"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {submittedDate} · Score: {submission.score}/{submission.totalPossible}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </ScreenShell>
  );
}
