import { Skeleton } from "@/components/ui";

export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Skeleton className="h-10 w-40" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="ml-auto h-6 w-20 rounded-full" />
                <Skeleton className="ml-auto h-6 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
