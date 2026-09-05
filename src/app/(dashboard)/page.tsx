import { getLessons, supabaseLessonsDb } from "@/entities/lesson/api/getLessons";
import { getStudentCredits, supabaseStudentCreditsDb } from "@/entities/student/api/getStudentCredits";
import { DashboardScreen } from "@/screens/dashboard/ui/DashboardScreen";
import { CURRENT_STUDENT_ID } from "@/shared/config/currentStudent";
import { getSupabaseServer } from "@/shared/lib/supabase/server";

// Never statically prerendered: this reads live Supabase data (and would
// otherwise fail `next build` when Supabase credentials aren't configured
// yet, which is the deferred-cloud-setup state this project is in).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = getSupabaseServer();
  const [lessons, credits] = await Promise.all([
    getLessons(supabaseLessonsDb(supabase)),
    getStudentCredits(supabaseStudentCreditsDb(supabase), CURRENT_STUDENT_ID),
  ]);
  const upcomingLesson = lessons.find((lesson) => lesson.status === "pending") ?? lessons[0] ?? null;

  return (
    <DashboardScreen
      parentName="Sarah"
      studentName="Lucas"
      moeLevel="Primary 2"
      credits={credits}
      upcomingLesson={upcomingLesson}
    />
  );
}
