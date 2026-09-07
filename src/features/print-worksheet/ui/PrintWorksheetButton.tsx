"use client";

import { useRef, useState } from "react";
import { ChevronDown, Printer } from "lucide-react";

import type { Lesson } from "@/entities/lesson/model/types";

type PrintWorksheetButtonProps = {
  lesson: Lesson;
};

export function PrintWorksheetButton({ lesson }: PrintWorksheetButtonProps) {
  const [loading, setLoading] = useState(false);
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
        className="flex items-center justify-between rounded-md text-sm text-primary outline-none hover:text-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
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
    </>
  );
}
