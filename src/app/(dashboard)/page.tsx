import { getLessons, supabaseLessonsDb } from "@/entities/lesson/api/getLessons";
import { DashboardScreen } from "@/screens/dashboard/ui/DashboardScreen";
import { getSupabaseServer } from "@/shared/lib/supabase/server";

// Never statically prerendered: this reads live Supabase data (and would
// otherwise fail `next build` when Supabase credentials aren't configured
// yet, which is the deferred-cloud-setup state this project is in).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const lessons = await getLessons(supabaseLessonsDb(getSupabaseServer()));
  const upcomingLesson = lessons.find((lesson) => lesson.status === "pending") ?? lessons[0] ?? null;

  return <DashboardScreen studentName="Sarah" moeLevel="Primary 2" upcomingLesson={upcomingLesson} />;
}
