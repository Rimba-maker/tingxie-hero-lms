import { describe, expect, it } from "vitest";

import { getCreditsDisplay } from "./getCreditsDisplay";

describe("getCreditsDisplay", () => {
  it("shows remaining credits, not used ones (mockup: 8 used of 20 total -> 12 Remaining)", () => {
    expect(getCreditsDisplay(8, 20)).toEqual({ remaining: 12, percent: 60 });
  });

  it("clamps remaining at 0 when used exceeds total (no hard quota enforcement)", () => {
    expect(getCreditsDisplay(25, 20)).toEqual({ remaining: 0, percent: 0 });
  });

  it("shows the full amount remaining when nothing has been used yet", () => {
    expect(getCreditsDisplay(0, 20)).toEqual({ remaining: 20, percent: 100 });
  });
});
