import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-col items-center justify-center w-full max-w-md mx-auto animate-fade-in-01-text mt-10">
      <div className="w-full space-y-4">
        <div className="border border-dashed border-zinc-800 rounded-md p-3 bg-zinc-950/10">
          <Skeleton className="h-4 w-32 bg-zinc-800" />
        </div>
        <div className="border border-dashed border-zinc-800 rounded-md p-3 bg-zinc-950/10">
          <Skeleton className="h-8 w-full bg-zinc-800" />
        </div>

        <div className="flex justify-between items-center border-b border-dashed border-zinc-800 pb-2">
          <Skeleton className="h-4 w-24 bg-zinc-800" />
          <Skeleton className="h-4 w-32 bg-zinc-800" />
        </div>

        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className="border border-dashed border-zinc-800 rounded-md p-4 bg-zinc-950/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-5 w-5 bg-zinc-800" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-48 bg-zinc-800" />
                  <Skeleton className="h-3 w-16 bg-zinc-800" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
