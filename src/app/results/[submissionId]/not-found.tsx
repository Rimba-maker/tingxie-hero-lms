import Link from "next/link";

import { buttonVariants } from "@/shared/ui/button";

// Reached via notFound() in page.tsx, not the generic error.tsx - a missing
// submission is an expected outcome (an old/invalid link), not an
// application error, and this file convention is what lets Next.js render
// this friendly message intact rather than a generic error digest.
export default function ResultNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 p-8 text-center">
      <p className="text-lg font-semibold">This result couldn&apos;t be found</p>
      <p className="text-sm text-muted-foreground">The submission link may be old or invalid.</p>
      <Link href="/" className={buttonVariants()}>
        Back to Dashboard
      </Link>
    </div>
  );
}
