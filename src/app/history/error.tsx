"use client";

import { useEffect } from "react";

import { Button } from "@/shared/ui/button";

export default function HistoryError({
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
      <p className="text-lg font-semibold">Couldn&apos;t load your history</p>
      {/* Never error.message here: Next.js replaces it with a generic,
          technical-sounding digest string for Server Component errors in
          production (confirmed via official docs) - not something a parent
          should see. console.error above already captures the real one. */}
      <p className="text-sm text-muted-foreground">Something went wrong. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
