export type CharacterHistoryRow = {
  character: string;
  date: string;
  isCorrect: boolean;
};

export type CharacterHistoryMatrix = {
  dates: string[];
  rows: { character: string; resultsByDate: Record<string, boolean> }[];
};

// A character can appear in more than one submission on the same calendar
// day (two lessons sharing a character, or a re-scan) - `date` is a
// day-level string, not a unique key. When that happens, the last matching
// row in `rows` wins that cell, so a caller querying multiple attempts must
// hand rows back in chronological order for this to mean "today's most
// recent attempt" rather than an arbitrary one (see getCharacterHistory.ts's
// explicit `.order()` for the real DB-backed caller).
export function buildCharacterHistoryMatrix(rows: CharacterHistoryRow[]): CharacterHistoryMatrix {
  const dates = [...new Set(rows.map((row) => row.date))].sort();

  const byCharacter = new Map<string, Record<string, boolean>>();
  for (const row of rows) {
    if (!byCharacter.has(row.character)) {
      byCharacter.set(row.character, {});
    }
    byCharacter.get(row.character)![row.date] = row.isCorrect;
  }

  const matrixRows = [...byCharacter.entries()].map(([character, resultsByDate]) => ({
    character,
    resultsByDate,
  }));

  return { dates, rows: matrixRows };
}
