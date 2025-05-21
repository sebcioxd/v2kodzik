"use client";

import { ExternalLink, Clock, Lock } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import axios from "axios";

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
    <div className="w-full space-y-3 animate-slide-in-bottom">
      <div className="flex items-center gap-2 text-zinc-400 text-sm">
      </div>
      {[1, 2].map((i) => (
        <div 
          key={i}
          className="border border-dashed border-zinc-800 rounded-md p-4 bg-zinc-950/10"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex  gap-2">
              <Skeleton className="h-4 w-24 bg-zinc-800" />
            </div>
            <Skeleton className="h-8 w-8 bg-zinc-800" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-32 bg-zinc-800" />
            <Skeleton className="h-3 w-32 bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecentShareCard({ slug, createdAt, expiresAt, private: isPrivate }: ShareCardProps) {
  return (
    <div className="border border-dashed border-zinc-800 rounded-md p-4 bg-zinc-950/10 hover:bg-zinc-950/20 transition-colors w-full animate-slide-in-bottom mt-5">
      <div className="flex justify-between items-center mb-2">
        <div className="flex ">
          <span className="text-zinc-200 text-sm font-medium flex items-center gap-2">
            Kod: {slug} {isPrivate ? <Lock className="h-4 w-4 text-zinc-400" /> : null}
          </span> 
        </div>
        <Link
          href={`/${slug}`}
          className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 p-2 rounded-md flex flex-row gap-1 items-center justify-center"
        > 
          <ExternalLink className="h-4 w-4" /> 
        </Link>
      </div>
      <div className="flex justify-between flex-col items-start gap-2 text-xs text-zinc-400">
        <span>Utworzono: {formatDate(createdAt)}</span>
        <span>Wygasa: {formatDate(expiresAt)}</span>
      </div>
    </div>
  );
}

// Add type definition for the API response
interface Share {
  id: string;
  slug: string;
  createdAt: string;
  expiresAt: string;
  private: boolean;
}

interface SharesResponse {
  posts: Share[];
}

// Update RecentShares component
export function RecentShares({ isLoading: initialLoading = false }) {
  const [shares, setShares] = useState<Share[]>([]);
  const [isLoading, setIsLoading] = useState(initialLoading);

  useEffect(() => {
    const fetchShares = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<SharesResponse>(`${process.env.NEXT_PUBLIC_API_URL}/v1/last-posts`);
        setShares(response.data.posts);
      } catch (error) {
        console.error('Failed to fetch recent shares:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShares();
  }, []);

  if (isLoading) {
    return <RecentSharesSkeleton />;
  }

  if (shares.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center gap-4 mt-5">
        <div className="text-zinc-400 text-sm animate-slide-in-bottom font-medium self-start">Brak linków w ostatnich 24 godzinach. <Link href="/upload" className="text-zinc-300 hover:text-zinc-100 transition-colors underline underline-offset-4">Dodaj teraz</Link></div>
      </div>
    );
  }

  return (
    <div className="w-full grid md:grid-cols-3 grid-cols-1 gap-4">
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