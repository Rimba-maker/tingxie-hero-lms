"use client";

import { useEffect } from "react";

// Catches errors in the root layout itself — must render its own <html>/<body>
// since it replaces the root layout when triggered. Everything else is caught
// by the route-level error.tsx files instead.
export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-lg font-semibold">Something went wrong</p>
        <p className="text-sm text-gray-500">Please refresh the page or try again shortly.</p>
        <button type="button" onClick={reset} className="rounded-lg border px-4 py-2">
          Try again
        </button>
      </body>
    </html>
  );
}
