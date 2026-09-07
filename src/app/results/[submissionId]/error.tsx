"use client";

import { useEffect } from "react";

import { Button } from "@/shared/ui/button";

// A missing submission never reaches here - page.tsx routes that specific,
// expected case to not-found.tsx via notFound(). This boundary is only for
// genuinely unexpected failures (a real Supabase outage, etc.), where
// error.message is a Next.js-generated digest in production, not the
// original message - so there's nothing more specific to show here.
export default function ResultsError({
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
      <p className="text-lg font-semibold">Couldn&apos;t load this result</p>
      <p className="text-sm text-muted-foreground">Something went wrong. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
