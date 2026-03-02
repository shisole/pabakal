import { Card, Skeleton } from "@/components/ui";

export default function CargoDetailLoading() {
  return (
    <div>
      <Skeleton className="mb-4 h-4 w-48" />
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-20 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <Skeleton className="mb-4 h-6 w-36" />
            <div className="flex gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton className="mb-4 h-6 w-32" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-1 h-3 w-24" />
                  <Skeleton className="h-5 w-36" />
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div>
          <Card className="p-6">
            <Skeleton className="mb-4 h-6 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border-l-2 border-gray-200 pl-3">
                  <Skeleton className="mb-1 h-4 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
