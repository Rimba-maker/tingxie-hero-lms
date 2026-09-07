import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildCharacterHistoryMatrix,
  type CharacterHistoryMatrix,
  type CharacterHistoryRow,
} from "./buildCharacterHistoryMatrix";

export type CharacterHistoryDb = {
  listCharacterHistory(characters: string[]): Promise<CharacterHistoryRow[]>;
};

export async function getCharacterHistory(
  db: CharacterHistoryDb,
  characters: string[],
): Promise<CharacterHistoryMatrix> {
  if (characters.length === 0) return { dates: [], rows: [] };
  const rows = await db.listCharacterHistory(characters);
  return buildCharacterHistoryMatrix(rows);
}

type CharacterResultWithSubmittedAt = {
  character: string;
  is_correct: boolean;
  submissions: { submitted_at: string } | null;
};

// Real Supabase-backed implementation. Untested glue — the pivot logic
// worth testing lives in buildCharacterHistoryMatrix. Single batched query
// across all matching characters (FSD §4 implementation note), not one
// query per character.
export function supabaseCharacterHistoryDb(supabase: SupabaseClient): CharacterHistoryDb {
  return {
    async listCharacterHistory(characters) {
      // Ordered so buildCharacterHistoryMatrix's same-day collision handling
      // (last row for a given character+date wins) is deterministic - a
      // student can submit two worksheets sharing a character on the same
      // calendar day, and without this, Postgres doesn't guarantee which
      // row comes back first, so the matrix cell could flip between correct
      // and incorrect on every reload for the exact same data.
      const { data, error } = await supabase
        .from("character_results")
        .select("character, is_correct, submissions(submitted_at)")
        .in("character", characters)
        .order("submitted_at", { foreignTable: "submissions", ascending: true });
      if (error) throw error;

      return (data as unknown as CharacterResultWithSubmittedAt[])
        .filter((row) => row.submissions !== null)
        .map((row) => ({
          character: row.character,
          isCorrect: row.is_correct,
          date: row.submissions!.submitted_at.slice(0, 10),
        }));
    },
  };
}
