import { Button } from "@/shared/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

type CreditsCardProps = {
  used: number;
  total: number;
  expiresOn: string;
};

export function CreditsCard({ used, total, expiresOn }: CreditsCardProps) {
  const percent = Math.round((used / total) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
          Prepaid Lesson Credits
        </CardTitle>
        <CardAction>
          <Button size="sm" variant="secondary">
            Top Up
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-2xl font-semibold">
          {used} <span className="text-base font-normal text-muted-foreground">of {total} Remaining</span>
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-xs text-muted-foreground">Credits expire on {expiresOn}</span>
      </CardContent>
    </Card>
  );
}
