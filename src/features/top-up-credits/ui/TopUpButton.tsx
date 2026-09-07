"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";

export function TopUpButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTopUp() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/credits/topup", { method: "POST" });
      if (!response.ok) {
        // Previously silent: a non-ok response (Supabase down, network
        // error) just re-enabled the button with nothing said - a parent
        // clicking Top Up deserves to know it didn't work.
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Top up failed, please try again");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Top up failed, please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* h-11 (44px): the "sm" size alone measured only 28px tall live. */}
      <Button size="sm" className="h-11" onClick={handleTopUp} disabled={loading}>
        {loading ? "Adding…" : "Top Up"}
      </Button>
      {/* A screen reader focused on the button won't hear its own label
          change mid-click - a separate live region announces it instead. */}
      <span role="status" aria-live="polite" className="sr-only">
        {loading ? "Adding credits…" : ""}
      </span>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </>
  );
}
