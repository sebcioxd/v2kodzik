"use client";

import { ExternalLink, Clock, Lock } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useFetch, LastPosts } from "@/app/hooks/use-fetch";

interface ShareCardProps {
  slug: string;
  createdAt: string;
  expiresAt: string;
  private: boolean;
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Data niedostępna';
  }
}

// Add skeleton component
export function RecentSharesSkeleton() {
  return (
    <div className="w-full grid md:grid-cols-3 grid-cols-1 gap-4 animate-slide-in-bottom">
      {[1, 2, 3].map((i) => (
        <div 
          key={i}
          className="border border-dashed border-zinc-800 rounded-md p-4 bg-zinc-950/10 mt-5"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex">
              <span className="flex items-center gap-2">
                <Skeleton className="h-4 w-20 bg-zinc-800" /> 
                <Skeleton className="h-4 w-4 rounded-full bg-zinc-800" />
              </span>
            </div>
            <div className="p-2 rounded-md">
              <Skeleton className="h-4 w-4 bg-zinc-800" />
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <Skeleton className="h-3 w-40 bg-zinc-800" /> 
            <Skeleton className="h-3 w-40 bg-zinc-800" /> 
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecentShareCard({ slug, createdAt, expiresAt, private: isPrivate }: ShareCardProps) {
  return (
    <div className="border border-dashed border-zinc-800 rounded-md p-4 bg-zinc-950/10 hover:bg-zinc-950/20 transition-colors w-full animate-slide-in-bottom mt-2">
      <div className="flex justify-between items-center">
        <div className="flex">
          <span className="text-zinc-400 text-md font-medium flex items-center gap-2">
            Kod linku: <span className="text-zinc-200 ml-[-1px] break-all whitespace-pre-wrap">{slug}</span> {isPrivate ? <Lock className="h-4 w-4 text-zinc-400" /> : null}
          </span> 
        </div>
        <Link
          href={`/${slug}`}
          className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 p-2 rounded-md flex flex-row gap-1 items-center justify-center"
        > 
          <ExternalLink className="h-4 w-4" /> 
        </Link>
      </div>
      <div className="flex justify-between flex-col items-start gap-2 mt-2 text-sm text-zinc-400">
        <span>Utworzono: {formatDate(createdAt)}</span>
        <span>Wygasa: {formatDate(expiresAt)}</span>
      </div>
    </div>
  );
}


// Update RecentShares component
export function RecentShares() {
  const { lastPosts, isLastPostsLoading, isLastPostsError } = useFetch();
  const [shares, setShares] = useState<LastPosts[]>([]);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (lastPosts) {
      setShares(lastPosts.posts);
      setCount(lastPosts.count);
    }
  }, [lastPosts]);


  if (isLastPostsLoading) {
    return <RecentSharesSkeleton />;
  }

  if (isLastPostsError) {
    return <div className="text-zinc-400 text-sm animate-slide-in-bottom font-medium self-start">Wystąpił błąd podczas ładowania linków. <Link href="/upload" className="text-zinc-300 hover:text-zinc-100 transition-colors underline underline-offset-4">Dodaj teraz</Link></div>
  }

  if (shares.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-4">
        <div className="text-zinc-400 text-sm animate-slide-in-bottom font-medium self-start">Brak linków w ostatnich 24 godzinach. <Link href="/upload" className="text-zinc-300 hover:text-zinc-100 transition-colors underline underline-offset-4">Dodaj teraz</Link></div>
      </div>
    );
  }
  

  return (
    <div className={`w-full grid ${count === 1 ? "md:grid-cols-1" : count === 2 ? "md:grid-cols-2" : "md:grid-cols-3"} grid-cols-1 gap-4`}>
      {shares.map((share) => (
        <RecentShareCard
          key={share.id}
          slug={share.slug}
          createdAt={share.createdAt}
          expiresAt={share.expiresAt}
          private={share.private}
        />
      ))}
    </div>
  );
}