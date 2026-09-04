"use client";

import { useEffect } from "react";

import { Button } from "@/shared/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 p-8 text-center">
      <p className="text-lg font-semibold">Couldn&apos;t load your dashboard</p>
      <p className="text-sm text-muted-foreground">
        {error.message || "Something went wrong. Please try again."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
