"use client";

import { useState } from "react";

export const MOE_LEVELS = ["P1", "P2", "P3", "P4", "P5", "P6"] as const;
export type MoeLevel = (typeof MOE_LEVELS)[number];

export function useLevelTab(initialLevel: MoeLevel = "P2") {
  const [level, setLevel] = useState<MoeLevel>(initialLevel);
  return { level, setLevel };
}
