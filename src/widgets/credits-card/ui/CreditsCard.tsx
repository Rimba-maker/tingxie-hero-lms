import { TopUpButton } from "@/features/top-up-credits/ui/TopUpButton";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import { getCreditsDisplay } from "../model/getCreditsDisplay";

type CreditsCardProps = {
  used: number;
  total: number;
  expiresOn: string;
};

export function CreditsCard({ used, total, expiresOn }: CreditsCardProps) {
  const { remaining, percent } = getCreditsDisplay(used, total);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
          Prepaid Lesson Credits
        </CardTitle>
        <CardAction>
          <TopUpButton />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-2xl font-semibold">
          {remaining}{" "}
          <span className="text-base font-normal text-muted-foreground">of {total} Remaining</span>
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-xs text-muted-foreground">Credits expire on {expiresOn}</span>
      </CardContent>
    </Card>
  );
}
