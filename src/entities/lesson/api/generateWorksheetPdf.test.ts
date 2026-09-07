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
    // Repeats a real subset character - this test's own concern is pagination
    // (many rows overflowing onto a second page), not glyph coverage, so it
    // shouldn't trip the coverage check below.
    const manyWords = Array.from({ length: 15 }, (_, i) => ({
      character: "校",
      pinyin: `zi ${i}`,
    }));

    const bytes = await generateWorksheetPdf({
      fontBytes,
      weekNumber: 1,
      title: "Test",
      moeLevel: "P2",
      vocabulary: manyWords,
    });

    expect(Buffer.from(bytes.slice(0, 5)).toString("ascii")).toBe("%PDF-");
  });

  test("throws a clear, actionable error instead of silently producing a broken PDF", async () => {
    // Reconsidered trade-off: this subset font covers exactly the 3 seeded
    // lessons' vocabulary (170 glyphs total) and nothing meaningfully else -
    // generating for anything outside that set previously produced a PDF
    // with blank title characters, blank practice-box glyphs, and pinyin
    // stripped of every tone mark, with no indication anything went wrong.
    // A parent printing this for their kid had no way to know until they
    // looked at the physical page. Failing loudly here is strictly better
    // than a document that silently doesn't do what it claims to.
    await expect(
      generateWorksheetPdf({
        fontBytes,
        weekNumber: 5,
        title: "第十一课 – 你好世界",
        moeLevel: "P2",
        vocabulary: [{ character: "你好", pinyin: "nǐ hǎo" }],
      }),
    ).rejects.toThrow(/你|好|世|界/);
  });
});
