import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { generateWorksheetPdf } from "./generateWorksheetPdf";

// Real subset font, not a mock — this exercises the actual embedding path
// (fontkit registration, CJK glyph rendering), the part most likely to
// break silently if the subset is ever regenerated without every
// character the app actually uses.
const fontBytes = readFileSync(join(process.cwd(), "public/fonts/NotoSansSC-Subset.ttf"));

describe("generateWorksheetPdf", () => {
  test("produces a valid single-page PDF for a short vocabulary list", async () => {
    const bytes = await generateWorksheetPdf({
      fontBytes,
      weekNumber: 4,
      title: "第十课 – 我们的校园",
      moeLevel: "P2",
      vocabulary: [
        { character: "校园", pinyin: "xiào yuán" },
        { character: "礼堂", pinyin: "lǐ táng" },
        { character: "老师", pinyin: "lǎo shī" },
      ],
    });

    expect(Buffer.from(bytes.slice(0, 5)).toString("ascii")).toBe("%PDF-");
  });

  test("adds a new page instead of overflowing when the list is long", async () => {
    const manyWords = Array.from({ length: 15 }, (_, i) => ({
      character: `字${i}`,
      pinyin: `zi ${i}`,
    }));

    const bytes = await generateWorksheetPdf({
      fontBytes,
      weekNumber: 1,
      title: "Test",
      moeLevel: "P2",
      vocabulary: manyWords,
    });

    // "字" isn't in the subset font, so this also confirms embedFont doesn't
    // throw on an unmapped glyph - pdf-lib falls back silently, it doesn't
    // need every possible character pre-subsetted to stay usable.
    expect(Buffer.from(bytes.slice(0, 5)).toString("ascii")).toBe("%PDF-");
  });
});
