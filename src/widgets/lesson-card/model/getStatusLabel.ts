import type { Lesson } from "@/entities/lesson/model/types";

export function getStatusLabel(lesson: Lesson): string {
  if (lesson.status === "needs_revision") return "Needs Revision";
  if (lesson.status === "pending") return "Pending Practice";

  if (!lesson.latestScore) return "Completed";
  const percent = Math.round((lesson.latestScore.score / lesson.latestScore.totalPossible) * 100);
  return `Completed (${percent}%)`;
}
