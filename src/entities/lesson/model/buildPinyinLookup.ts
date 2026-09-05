import type { VocabEntry } from "./types";

export function buildPinyinLookup(vocabulary: VocabEntry[]): Map<string, string> {
  return new Map(vocabulary.map((entry) => [entry.character, entry.pinyin]));
}
