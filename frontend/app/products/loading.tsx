import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-8">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-24" />
      </div>
    </main>
  );
}
