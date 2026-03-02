import { Skeleton } from "@/components/ui";

export default function PaymentsLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-4 w-36" />
      <Skeleton className="mb-6 h-8 w-56" />
      <div className="overflow-x-auto rounded-2xl bg-white shadow-md dark:bg-gray-900">
        <div className="p-4">
          <div className="mb-4 flex gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="ml-auto h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
