import { describe, expect, test } from "vitest";

import { buildPinyinLookup } from "./buildPinyinLookup";

describe("buildPinyinLookup", () => {
  test("maps each vocabulary entry's character to its pinyin", () => {
    const lookup = buildPinyinLookup([
      { character: "校园", pinyin: "xiào yuán" },
      { character: "礼堂", pinyin: "lǐ táng" },
    ]);

    expect(lookup.get("校园")).toBe("xiào yuán");
    expect(lookup.get("礼堂")).toBe("lǐ táng");
  });

  // character_results.character is populated from Gemini's parsed JSON output
  // with no server-side charset/enum validation — a Map has no prototype
  // chain to accidentally resolve, unlike the plain object this used to be
  // built as (`{}[  "__proto__"]` resolves Object.prototype, not undefined).
  test("returns undefined for an unknown character, including prototype-chain keys", () => {
    const lookup = buildPinyinLookup([{ character: "校园", pinyin: "xiào yuán" }]);

    expect(lookup.get("温暖")).toBeUndefined();
    expect(lookup.get("__proto__")).toBeUndefined();
    expect(lookup.get("constructor")).toBeUndefined();
  });
});
