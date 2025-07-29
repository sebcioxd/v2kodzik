import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-md max-w-sm animate-fade-in-01-text mt-10">
      <div className="w-full space-y-4">
        {/* URL bar with share button */}
        <div className="flex flex-col gap-2">
          <div className="border-b border-dashed border-zinc-800 p-3 bg-zinc-950/10 backdrop-blur-sm flex items-center justify-between">
            <Skeleton className="h-4 w-40 bg-zinc-800" />
            <Skeleton className="h-8 w-8 bg-zinc-800 rounded-md" />
          </div>
        </div>

        {/* Expiration info */}
        <div className="border border-dashed border-zinc-800 rounded-md p-3 bg-zinc-950/10 backdrop-blur-sm flex items-center justify-between">
          <Skeleton className="h-4 w-28 bg-zinc-800" />
          <Skeleton className="h-4 w-16 bg-zinc-800" />
        </div>

        {/* Bulk download button */}
        <Skeleton className="h-5 w-full bg-zinc-800 rounded-md" />

        {/* Files count and total size */}
        <div className="flex justify-between items-center border-b border-dashed border-zinc-800 pb-2">
          <Skeleton className="h-4 w-20 bg-zinc-800" />
          <Skeleton className="h-4 w-24 bg-zinc-800" />
        </div>

        {/* File items */}
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className="border border-dashed border-zinc-800 rounded-md p-3 bg-zinc-950/10 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-5 w-5 bg-zinc-800" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-48 bg-zinc-800" />
                  <Skeleton className="h-3 w-16 bg-zinc-800" />
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Skeleton className="h-6 w-6 bg-zinc-800 rounded-md" />
                <Skeleton className="h-6 w-6 bg-zinc-800 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
