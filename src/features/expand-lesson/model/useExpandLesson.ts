"use client";

import { useState } from "react";

export function useExpandLesson(initiallyExpandedIds: string[] = []) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(initiallyExpandedIds));

  function toggle(lessonId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  }

  return { isExpanded: (lessonId: string) => expandedIds.has(lessonId), toggle };
}
