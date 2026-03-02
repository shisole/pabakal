import { Card, Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-40" />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-9 w-32" />
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <Skeleton className="mb-4 h-6 w-36" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
