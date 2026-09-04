import { describe, expect, test } from "vitest";

import { buildCharacterHistoryMatrix } from "./buildCharacterHistoryMatrix";

describe("buildCharacterHistoryMatrix", () => {
  test("pivots character x date rows into a dates list and one row per character", () => {
    const matrix = buildCharacterHistoryMatrix([
      { character: "礼堂", date: "2026-10-10", isCorrect: false },
      { character: "校园", date: "2026-10-08", isCorrect: false },
      { character: "礼堂", date: "2026-10-08", isCorrect: false },
      { character: "校园", date: "2026-10-12", isCorrect: true },
      { character: "礼堂", date: "2026-10-12", isCorrect: false },
    ]);

    expect(matrix.dates).toEqual(["2026-10-08", "2026-10-10", "2026-10-12"]);
    expect(matrix.rows).toEqual([
      {
        character: "礼堂",
        resultsByDate: { "2026-10-08": false, "2026-10-10": false, "2026-10-12": false },
      },
      {
        character: "校园",
        resultsByDate: { "2026-10-08": false, "2026-10-12": true },
      },
    ]);
  });

  test("returns an empty matrix for no rows", () => {
    expect(buildCharacterHistoryMatrix([])).toEqual({ dates: [], rows: [] });
  });
});
