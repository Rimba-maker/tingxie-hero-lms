export type Submission = {
  id: string;
  studentId: string;
  lessonId: string;
  imageUrl: string;
  totalScore: number | null;
  totalPossible: number;
  status: "pending" | "graded" | "failed";
  submittedAt: string;
  gradedAt: string | null;
};
