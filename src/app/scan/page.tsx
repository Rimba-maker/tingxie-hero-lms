import { ScanScreen } from "@/screens/scan/ui/ScanScreen";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ lessonId?: string }>;
}) {
  const { lessonId } = await searchParams;
  return <ScanScreen lessonId={lessonId ?? ""} />;
}
