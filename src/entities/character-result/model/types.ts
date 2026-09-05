// Gemini's own bounding-box coordinate space: [ymin, xmin, ymax, xmax]
// normalized to 0-1000, scaled to the source image's actual dimensions
// (per Gemini's image-understanding docs — verified via Context7).
export type BoundingBox = {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
};

export type CharacterResult = {
  character: string;
  isCorrect: boolean;
  // Absent for rows graded before this field existed, or when Gemini
  // omits it for a given character — the overlay simply skips those.
  boundingBox?: BoundingBox;
};
