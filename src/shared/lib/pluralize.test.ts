import { describe, expect, test } from "vitest";

import { pluralize } from "./pluralize";

describe("pluralize", () => {
  test("returns the singular form for a count of 1", () => {
    expect(pluralize(1, "character")).toBe("character");
  });

  test("returns the regular plural form for counts other than 1", () => {
    expect(pluralize(0, "character")).toBe("characters");
    expect(pluralize(2, "character")).toBe("characters");
  });

  test("accepts an irregular plural form", () => {
    expect(pluralize(1, "lesson", "lessons")).toBe("lesson");
    expect(pluralize(3, "lesson", "lessons")).toBe("lessons");
  });
});
