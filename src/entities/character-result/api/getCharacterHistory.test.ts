import { describe, expect, test, vi } from "vitest";

import { getCharacterHistory, type CharacterHistoryDb } from "./getCharacterHistory";

describe("getCharacterHistory", () => {
  test("skips the DB call entirely for an empty character list", async () => {
    // A submission with zero character_results (e.g. an all-empty Gemini
    // result caught before it's ever saved as graded - Phase 22 - or a
    // manually-inserted fixture like the History e2e test's) has nothing
    // to look up; querying `.in("character", [])` would be a wasted round
    // trip at best.
    const listCharacterHistory = vi.fn();
    const fakeDb: CharacterHistoryDb = { listCharacterHistory };

    const result = await getCharacterHistory(fakeDb, []);

    expect(result).toEqual({ dates: [], rows: [] });
    expect(listCharacterHistory).not.toHaveBeenCalled();
  });

  test("queries the DB and pivots the result for a real character list", async () => {
    const fakeDb: CharacterHistoryDb = {
      listCharacterHistory: async (characters) => {
        expect(characters).toEqual(["校园", "礼堂"]);
        return [
          { character: "校园", isCorrect: true, date: "2026-09-01" },
          { character: "礼堂", isCorrect: false, date: "2026-09-01" },
        ];
      },
    };

    const result = await getCharacterHistory(fakeDb, ["校园", "礼堂"]);

    expect(result).toEqual({
      dates: ["2026-09-01"],
      rows: [
        { character: "校园", resultsByDate: { "2026-09-01": true } },
        { character: "礼堂", resultsByDate: { "2026-09-01": false } },
      ],
    });
  });
});
