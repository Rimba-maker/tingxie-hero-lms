"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/shared/ui/button";

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

  const isNotFound = error.message.startsWith("Submission not found");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 p-8 text-center">
      <p className="text-lg font-semibold">
        {isNotFound ? "This result couldn't be found" : "Couldn't load this result"}
      </p>
      <p className="text-sm text-muted-foreground">
        {isNotFound
          ? "The submission link may be old or invalid."
          : error.message || "Something went wrong. Please try again."}
      </p>
      {isNotFound ? (
        <Button render={<Link href="/" />} nativeButton={false}>
          Back to Dashboard
        </Button>
      ) : (
        <Button onClick={reset}>Try again</Button>
      )}
    </div>
  );
}
