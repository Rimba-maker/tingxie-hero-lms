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
      const { data, error } = await supabase
        .from("character_results")
        .select("character, is_correct, submissions(submitted_at)")
        .in("character", characters);
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
