export type VocabEntry = {
  character: string;
  pinyin: string;
};

export type Lesson = {
  id: string;
  weekNumber: number;
  title: string;
  moeLevel: string;
  status: "pending" | "completed" | "needs_revision";
  vocabulary: VocabEntry[];
  testScheduledAt: string | null; // ISO timestamp — null when no test date is set yet
  // From the lesson's most recent graded submission, if any — drives the
  // real percentage on the "Completed" status tag instead of a fixed number.
  latestScore: { score: number; totalPossible: number } | null;
};
