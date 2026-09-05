import type { BoundingBox } from "./types";

// Gemini's box_2d space is normalized to 0-1000 regardless of the source
// image's actual pixel dimensions, so it maps directly to percentages of
// an absolutely-positioned container the same size as the rendered photo.
export function boundingBoxToOverlayStyle(box: BoundingBox) {
  return {
    top: `${box.ymin / 10}%`,
    left: `${box.xmin / 10}%`,
    width: `${(box.xmax - box.xmin) / 10}%`,
    height: `${(box.ymax - box.ymin) / 10}%`,
  };
}
