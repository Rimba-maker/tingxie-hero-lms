import { Skeleton } from "@/shared/ui/skeleton";

export default function SyllabusLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="size-5 rounded-full" />
      </div>
      <Skeleton className="h-8 w-full rounded-lg" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}
