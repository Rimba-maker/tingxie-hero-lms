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
};
