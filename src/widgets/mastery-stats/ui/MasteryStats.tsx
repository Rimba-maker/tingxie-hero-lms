import { BookOpen, CircleCheck } from "lucide-react";

import { Card, CardContent } from "@/shared/ui/card";

type MasteryStatsProps = {
  masteryRatePercent: number;
  masteryRateDeltaThisMonth: number;
  charactersPracticed: number;
  listsCovered: number;
};

export function MasteryStats({
  masteryRatePercent,
  masteryRateDeltaThisMonth,
  charactersPracticed,
  listsCovered,
}: MasteryStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card>
        <CardContent className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
            Mastery Rate
            <CircleCheck className="size-3.5" />
          </div>
          <p className="text-xl font-semibold">{masteryRatePercent}%</p>
          <span className="text-xs text-success">+{masteryRateDeltaThisMonth}% this month</span>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
            Practiced
            <BookOpen className="size-3.5" />
          </div>
          <p className="text-xl font-semibold">{charactersPracticed} Characters</p>
          <span className="text-xs text-muted-foreground">{listsCovered} lists covered</span>
        </CardContent>
      </Card>
    </div>
  );
}
