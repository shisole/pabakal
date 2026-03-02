import { Card, Skeleton } from "@/components/ui";

export default function OrderDetailLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-4 w-52" />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-1 h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <Skeleton className="mb-4 h-6 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="ml-auto h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </Card>
          <Card className="p-6">
            <Skeleton className="mb-4 h-6 w-36" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="ml-auto h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6">
            <Skeleton className="mb-4 h-6 w-20" />
            <Skeleton className="mb-2 h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </Card>
          <Card className="p-6">
            <Skeleton className="mb-4 h-6 w-24" />
            <Skeleton className="mb-1 h-4 w-36" />
            <Skeleton className="mb-1 h-4 w-44" />
            <Skeleton className="h-4 w-28" />
          </Card>
          <Card className="p-6">
            <Skeleton className="mb-4 h-6 w-36" />
            <Skeleton className="mb-1 h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        </div>
      </div>
    </div>
  );
}
