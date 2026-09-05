import { describe, expect, it } from "vitest";

import { boundingBoxToOverlayStyle } from "./boundingBoxToOverlayStyle";

describe("boundingBoxToOverlayStyle", () => {
  it("converts a 0-1000 normalized box into CSS percentages", () => {
    expect(boundingBoxToOverlayStyle({ ymin: 100, xmin: 200, ymax: 300, xmax: 400 })).toEqual({
      top: "10%",
      left: "20%",
      width: "20%",
      height: "20%",
    });
  });

  it("handles a box spanning the full image", () => {
    expect(boundingBoxToOverlayStyle({ ymin: 0, xmin: 0, ymax: 1000, xmax: 1000 })).toEqual({
      top: "0%",
      left: "0%",
      width: "100%",
      height: "100%",
    });
  });
});
