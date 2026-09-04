import { getLessons, supabaseLessonsDb } from "@/entities/lesson/api/getLessons";
import { SyllabusScreen } from "@/screens/syllabus/ui/SyllabusScreen";
import { getSupabaseServer } from "@/shared/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SyllabusPage() {
  const lessons = await getLessons(supabaseLessonsDb(getSupabaseServer()));

  return <SyllabusScreen studentName="Sarah" moeLevel="P2" lessons={lessons} />;
}
