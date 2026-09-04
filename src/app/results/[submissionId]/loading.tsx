import { Skeleton } from "@/shared/ui/skeleton";

export default function ResultsLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
      </div>
    </div>
  );
}
