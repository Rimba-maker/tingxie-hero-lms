"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import type HanziWriterType from "hanzi-writer";

import { Button } from "@/shared/ui/button";

type StrokeOrderCardProps = {
  /** One character, or a multi-character word (e.g. "温暖") — hanzi-writer's
   * stroke data is keyed per single character, so a word is rendered as one
   * glyph animation per character, not one animation for the whole string. */
  character: string;
  pinyin?: string;
};

const GLYPH_SIZE = 72;

export function StrokeOrderCard({ character, pinyin }: StrokeOrderCardProps) {
  const glyphs = [...character];
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const writersRef = useRef<HanziWriterType[]>([]);
  const [failedGlyphs, setFailedGlyphs] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const containers = containerRefs.current.slice();

    // hanzi-writer itself ships in our own bundle (code-split here so Results
    // stays lean for the common case of a perfect score); only the
    // per-character stroke data is fetched from hanzi-writer's default CDN
    // at runtime, which is the one thing that can actually fail offline.
    import("hanzi-writer").then(({ default: HanziWriter }) => {
      if (cancelled) return;
      const writers = containers.flatMap((container, i) => {
        const glyph = glyphs[i];
        if (!container || glyph === undefined) return [];
        const writer = HanziWriter.create(container, glyph, {
          width: GLYPH_SIZE,
          height: GLYPH_SIZE,
          padding: 6,
          showOutline: true,
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 300,
          onLoadCharDataError: () => {
            if (!cancelled) setFailedGlyphs((prev) => new Set(prev).add(glyph));
          },
        });
        writer.animateCharacter();
        return [writer];
      });
      writersRef.current = writers;
    });

    return () => {
      cancelled = true;
      writersRef.current = [];
      for (const container of containers) {
        if (container) container.innerHTML = "";
      }
    };
    // `glyphs` is deterministically derived from `character` on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character]);

  return (
    <div className="flex shrink-0 flex-col items-center gap-1 rounded-lg bg-muted p-2 text-center">
      <div className="flex gap-1">
        {glyphs.map((glyph, i) => (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{ width: GLYPH_SIZE, height: GLYPH_SIZE }}
          >
            {failedGlyphs.has(glyph) ? (
              <span className="text-3xl">{glyph}</span>
            ) : (
              <div
                ref={(el) => {
                  containerRefs.current[i] = el;
                }}
              />
            )}
          </div>
        ))}
      </div>
      {pinyin && <p className="text-xs text-muted-foreground">{pinyin}</p>}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => writersRef.current.forEach((w) => w.animateCharacter())}
      >
        <RotateCcw data-icon="inline-start" />
        Replay
      </Button>
    </div>
  );
}
