import { Skeleton } from "@/components/ui/skeleton";

export function Loader() {
    return (
        <div className="space-y-4">
            {[...Array(1)].map((_, i) => (
                <div 
                    key={i}
                    className="bg-zinc-900/30 border border-zinc-900 rounded-md p-4 animate-pulse"
                >
                    {/* Header section with link info and visit button */}
                    <div className="flex justify-between items-center mb-2 border-b border-zinc-900 pb-2">
                        <div className="flex flex-col gap-2">
                            {/* Link code skeleton */}
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-4 bg-zinc-800" />
                                <Skeleton className="h-4 w-32 bg-zinc-800" />
                                <Skeleton className="h-4 w-20 bg-zinc-800" />
                                <Skeleton className="h-4 w-4 bg-zinc-800" />
                            </div>
                        </div>
                        {/* Visit button skeleton */}
                        {/* <Skeleton className="h-8 w-16 bg-zinc-800 rounded-md" /> */}
                    </div>
                    
                    {/* Date info section */}
                    <div className="flex flex-col gap-2 pt-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 bg-zinc-800" />
                            <Skeleton className="h-4 w-40 bg-zinc-800" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 bg-zinc-800" />
                            <Skeleton className="h-4 w-36 bg-zinc-800" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}