"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui/button";

export function TopUpButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleTopUp() {
    setLoading(true);
    const response = await fetch("/api/credits/topup", { method: "POST" });
    setLoading(false);
    if (response.ok) router.refresh();
  }

  return (
    <>
      <Button size="sm" onClick={handleTopUp} disabled={loading}>
        {loading ? "Adding…" : "Top Up"}
      </Button>
      {/* A screen reader focused on the button won't hear its own label
          change mid-click - a separate live region announces it instead. */}
      <span role="status" aria-live="polite" className="sr-only">
        {loading ? "Adding credits…" : ""}
      </span>
    </>
  );
}
