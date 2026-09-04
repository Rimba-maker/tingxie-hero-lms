import { Check, X } from "lucide-react";

import type { CharacterResult } from "@/entities/character-result/model/types";
import { cn } from "@/shared/lib/utils";

type CorrectionOverlayProps = {
  results: CharacterResult[];
};

// Annotation-list style, not a pixel-precise image overlay — per
// PRD_TingXieHero.md §5 assumption. Our grading data only ever carries the
// *expected* character + a correct/incorrect verdict (Gemini isn't asked to
// transcribe what the student actually wrote), so "correction" here means:
// wrong entries show the correct answer in red, not a diff against the
// student's mis-written character.
export function CorrectionOverlay({ results }: CorrectionOverlayProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {results.map((result, index) => (
        <div
          key={`${result.character}-${index}`}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm",
            result.isCorrect ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5",
          )}
        >
          {result.isCorrect ? (
            <Check className="size-4 text-success" />
          ) : (
            <X className="size-4 text-destructive" />
          )}
          <span className={result.isCorrect ? undefined : "font-medium text-destructive"}>
            {result.character}
          </span>
        </div>
      ))}
    </div>
  );
}
