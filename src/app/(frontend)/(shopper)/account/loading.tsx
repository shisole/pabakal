import { Skeleton } from "@/components/ui";

export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Skeleton className="h-10 w-40" />

      {/* Profile card skeleton */}
      <div className="mt-8 rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
        <Skeleton className="h-6 w-44" />
        <div className="mt-4 space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* Address card skeleton */}
      <div className="mt-6 rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
        <Skeleton className="h-6 w-36" />
        <div className="mt-4 space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
