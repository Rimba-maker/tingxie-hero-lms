import { Card, CardContent } from "@/shared/ui/card";

type ScoreHeaderProps = {
  score: number;
  totalPossible: number;
  gradedAt: string;
  charactersMissed: number;
};

export function ScoreHeader({ score, totalPossible, gradedAt, charactersMissed }: ScoreHeaderProps) {
  const percent = Math.round((score / totalPossible) * 100);
  const gradedDate = new Date(gradedAt).toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div
          className={
            "flex size-16 shrink-0 items-center justify-center rounded-full border-4 text-lg font-semibold " +
            (percent >= 70 ? "border-success text-success" : "border-destructive text-destructive")
          }
        >
          {percent}%
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-lg font-semibold">
            Score: {score}/{totalPossible}
          </p>
          <p className="text-xs text-muted-foreground">Graded on {gradedDate}</p>
          {charactersMissed > 0 && (
            <p className="text-xs text-destructive">{charactersMissed} characters missed</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
