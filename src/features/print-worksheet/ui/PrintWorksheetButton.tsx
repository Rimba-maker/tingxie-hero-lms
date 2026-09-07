"use client";

import { useRef, useState } from "react";
import { ChevronDown, Printer } from "lucide-react";

import type { Lesson } from "@/entities/lesson/model/types";

type PrintWorksheetButtonProps = {
  lesson: Lesson;
};

export function PrintWorksheetButton({ lesson }: PrintWorksheetButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preloaded = useRef(false);

  // Warm the dynamic import + font fetch on hover/focus, before the click
  // actually happens - by the time someone clicks after hovering, the
  // ~1.1MB chunk is often already in flight or cached. import() and
  // fetch() are both naturally deduped, so calling this more than once
  // (hover, then focus, then click) never re-fetches.
  function preload() {
    if (preloaded.current) return;
    preloaded.current = true;
    void import("@/entities/lesson/api/generateWorksheetPdf");
    void fetch("/fonts/NotoSansSC-Subset.ttf");
  }

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      // pdf-lib + fontkit are a genuinely large dependency (~1MB) for a
      // rarely-used action - dynamically imported so the Syllabus page's
      // own bundle stays lean, and this only loads for someone who
      // actually clicks Print.
      const [{ generateWorksheetPdf }, fontResponse] = await Promise.all([
        import("@/entities/lesson/api/generateWorksheetPdf"),
        fetch("/fonts/NotoSansSC-Subset.ttf"),
      ]);
      const fontBytes = await fontResponse.arrayBuffer();
      const pdfBytes = await generateWorksheetPdf({
        fontBytes,
        weekNumber: lesson.weekNumber,
        title: lesson.title,
        moeLevel: lesson.moeLevel,
        vocabulary: lesson.vocabulary,
      });

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tingxie-week-${lesson.weekNumber}-worksheet.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      // Previously uncaught: any failure here (unsupported characters -
      // FSD §6 Phase 29, an offline font fetch, anything) silently reset
      // the button with zero feedback. A parent clicking Print deserves to
      // know it didn't work, not just watch nothing happen.
      setError(err instanceof Error ? err.message : "Couldn't generate the worksheet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onMouseEnter={preload}
        onFocus={preload}
        onClick={handleClick}
        disabled={loading}
        // py-3 grows the tappable area to 44px without changing the visible
        // text/icon at all - a plain no-background button, so padding here
        // is invisible, just a bigger hit box (confirmed live at only 20px
        // tall before this).
        className="flex items-center justify-between rounded-md py-3 text-sm text-primary outline-none hover:text-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        <span className="flex items-center gap-1.5">
          <Printer className="size-4" />
          {loading ? "Preparing PDF…" : "Print A4 Worksheet (PDF)"}
        </span>
        <ChevronDown className="size-4 -rotate-90" />
      </button>
      {/* A screen reader focused on the button won't hear its own label
          change mid-click - a separate live region announces it instead. */}
      <span role="status" aria-live="polite" className="sr-only">
        {loading ? "Preparing worksheet PDF…" : ""}
      </span>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </>
  );
}
