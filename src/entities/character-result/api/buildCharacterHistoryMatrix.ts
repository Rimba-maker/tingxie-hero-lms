export type CharacterHistoryRow = {
  character: string;
  date: string;
  isCorrect: boolean;
};

export type CharacterHistoryMatrix = {
  dates: string[];
  rows: { character: string; resultsByDate: Record<string, boolean> }[];
};

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
