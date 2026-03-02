import { Skeleton } from "@/components/ui";

export default function HomeLoading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:py-24">
          <Skeleton className="mx-auto h-12 w-80" />
          <Skeleton className="mx-auto mt-4 h-6 w-96" />
          <Skeleton className="mx-auto mt-8 h-12 w-36" />
        </div>
      </div>
      {/* Categories skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
