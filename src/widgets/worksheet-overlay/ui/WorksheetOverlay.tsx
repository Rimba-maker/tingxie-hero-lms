import { Check, X } from "lucide-react";

import { boundingBoxToOverlayStyle } from "@/entities/character-result/model/boundingBoxToOverlayStyle";
import type { CharacterResult } from "@/entities/character-result/model/types";
import { cn } from "@/shared/lib/utils";

type WorksheetOverlayProps = {
  imageUrl: string;
  characterResults: CharacterResult[];
};

// This is the assignment's own "key evaluation point": photo -> backend ->
// correction -> frontend overlay of the correct word in red pen. Renders
// the graded photo with a red-pen mark over each wrong character (showing
// the correct word) and a green mark over each right one, positioned from
// the bounding box Gemini returns alongside the correctness verdict.
export function WorksheetOverlay({ imageUrl, characterResults }: WorksheetOverlayProps) {
  const marked = characterResults.filter((result) => result.boundingBox);
  if (marked.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, no next/image domain config needed for this */}
      <img src={imageUrl} alt="Scanned worksheet, graded" className="block w-full" />

      {marked.map((result, index) => {
        const style = boundingBoxToOverlayStyle(result.boundingBox!);
        return (
          <div
            key={`${result.character}-${index}`}
            className={cn(
              "absolute rounded-sm border-2",
              result.isCorrect ? "border-success" : "border-destructive",
            )}
            style={style}
          >
            <div
              className={cn(
                "absolute -top-2.5 -right-2.5 flex size-5 items-center justify-center rounded-full text-white",
                result.isCorrect ? "bg-success" : "bg-destructive",
              )}
            >
              {result.isCorrect ? <Check className="size-3" /> : <X className="size-3" />}
            </div>
            {!result.isCorrect && (
              <span
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded bg-destructive px-1.5 py-0.5 font-serif text-sm font-bold whitespace-nowrap text-white italic"
                aria-label={`Correct word: ${result.character}`}
              >
                {result.character}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
