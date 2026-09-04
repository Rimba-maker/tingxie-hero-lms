import { RotateCcw, Share2 } from "lucide-react";

import type { CharacterHistoryMatrix } from "@/entities/character-result/api/buildCharacterHistoryMatrix";
import type { SubmissionDetail } from "@/entities/submission/api/getSubmissionDetail";
import { Button } from "@/shared/ui/button";
import { CorrectionOverlay } from "@/widgets/correction-overlay/ui/CorrectionOverlay";
import { HistoricalMatrix } from "@/widgets/historical-matrix/ui/HistoricalMatrix";
import { ScoreHeader } from "@/widgets/score-header/ui/ScoreHeader";

type ResultsScreenProps = {
  submission: SubmissionDetail;
  historyMatrix: CharacterHistoryMatrix;
};

export function ResultsScreen({ submission, historyMatrix }: ResultsScreenProps) {
  const charactersMissed = submission.characterResults.filter((r) => !r.isCorrect).length;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Test Feedback</p>
      </div>

      <ScoreHeader
        score={submission.score ?? 0}
        totalPossible={submission.totalPossible}
        gradedAt={submission.submittedAt}
        charactersMissed={charactersMissed}
      />

      <div>
        <p className="mb-2 text-sm font-medium">Results</p>
        <CorrectionOverlay results={submission.characterResults} />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Results over time</p>
        <HistoricalMatrix matrix={historyMatrix} />
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1">
          <Share2 data-icon="inline-start" />
          Share Report
        </Button>
        <Button className="flex-1">
          <RotateCcw data-icon="inline-start" />
          Retest Missed
        </Button>
      </div>
    </div>
  );
}
