import Link from "next/link";
import { RotateCcw, Share2 } from "lucide-react";
import { preload } from "react-dom";

import type { CharacterHistoryMatrix } from "@/entities/character-result/api/buildCharacterHistoryMatrix";
import { buildPinyinLookup } from "@/entities/lesson/model/buildPinyinLookup";
import type { SubmissionDetail } from "@/entities/submission/api/getSubmissionDetail";
import { StrokeOrderCard } from "@/features/practice-stroke-order/ui/StrokeOrderCard";
import { Badge } from "@/shared/ui/badge";
import { Button, buttonVariants } from "@/shared/ui/button";
import { HistoricalMatrix } from "@/widgets/historical-matrix/ui/HistoricalMatrix";
import { ScoreHeader } from "@/widgets/score-header/ui/ScoreHeader";
import { ScreenShell } from "@/widgets/screen-shell/ui/ScreenShell";
import { WorksheetOverlay } from "@/widgets/worksheet-overlay/ui/WorksheetOverlay";

type ResultsScreenProps = {
  submission: SubmissionDetail;
  historyMatrix: CharacterHistoryMatrix;
};

export function ResultsScreen({ submission, historyMatrix }: ResultsScreenProps) {
  // A submission can sit at 'pending' (grading in progress, or never
  // retried after a failure) or 'failed' for a while now that grading can
  // be retried on the same id (Phase 21) - defaulting score to 0 and
  // showing a fabricated "Completed" 0% result for either state would tell
  // a parent their child failed a test that was never actually graded.
  if (submission.status !== "graded") {
    return (
      <ScreenShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
          <p className="text-lg font-semibold">
            {submission.status === "pending"
              ? "Still grading this worksheet…"
              : "Grading failed for this worksheet"}
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {submission.status === "pending"
              ? "Check back in a moment, or refresh this page."
              : "Please scan the worksheet again."}
          </p>
          <Link href="/" className={buttonVariants({ className: "mt-1" })}>
            Back to Dashboard
          </Link>
        </div>
      </ScreenShell>
    );
  }

  const missedCharacters = submission.characterResults.filter((r) => !r.isCorrect);
  const needsRevision = missedCharacters.length > 0;
  const pinyinByCharacter = buildPinyinLookup(submission.vocabulary);

  // The graded worksheet photo is this app's own named "key evaluation
  // point" - the whole reason this screen exists - and its exact URL is
  // already known here, server-side, before any HTML reaches the browser.
  // Hinting the browser to start fetching it now (rather than waiting for
  // WorksheetOverlay's own plain image tag to be discovered mid-hydration)
  // shaves a real round-trip off the one photo every reviewer actually
  // looks at.
  preload(submission.imageUrl, { as: "image" });

  return (
    <ScreenShell>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Test Feedback</p>
          <h1 className="text-lg font-semibold">
            {submission.lessonWeekNumber !== null
              ? `Week ${submission.lessonWeekNumber} Syllabus Test`
              : "Syllabus Test"}
          </h1>
        </div>
        <Badge variant={needsRevision ? "destructive" : "success"}>
          {needsRevision ? "Needs Revision" : "Completed"}
        </Badge>
      </div>

      <ScoreHeader
        score={submission.score ?? 0}
        totalPossible={submission.totalPossible}
        gradedAt={submission.submittedAt}
        charactersMissed={missedCharacters.length}
      />

      <WorksheetOverlay imageUrl={submission.imageUrl} characterResults={submission.characterResults} />

      <div>
        <p className="mb-2 text-sm font-medium">Results over time</p>
        <HistoricalMatrix matrix={historyMatrix} pinyinByCharacter={pinyinByCharacter} />
      </div>

      {missedCharacters.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Practice writing</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {missedCharacters.map((r) => (
              <StrokeOrderCard
                key={r.character}
                character={r.character}
                pinyin={pinyinByCharacter.get(r.character)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1">
          <Share2 data-icon="inline-start" />
          Share Report
        </Button>
        <Link
          href={submission.lessonId ? `/scan?lessonId=${submission.lessonId}` : "/scan"}
          className={buttonVariants({ className: "flex-1" })}
        >
          <RotateCcw data-icon="inline-start" />
          Retest Missed
        </Link>
      </div>
    </ScreenShell>
  );
}
