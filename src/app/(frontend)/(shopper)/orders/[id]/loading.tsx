import { Skeleton } from "@/components/ui";

export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-10 w-48" />
      <Skeleton className="mt-2 h-4 w-40" />

      {/* Items card skeleton */}
      <div className="mt-8 rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
        <Skeleton className="h-6 w-16" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Payment card skeleton */}
      <div className="mt-6 rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </div>

      {/* Address card skeleton */}
      <div className="mt-6 rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-2/3" />
      </div>
    </div>
  );
}
