"use client";

import { ExternalLink, Clock, Lock, FolderOpen, ChevronRight, FileIcon } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useLastPosts, LastPosts } from "@/app/hooks/use-fetch";
import { formatDate } from "@/lib/date";
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface ShareCardProps {
  slug: string;
  createdAt: string;
  expiresAt: string;
  private: boolean;
  id: string;
}

interface FileDetail {
  id: string;
  fileName: string;
  size: number;
  contentType: string;
  createdAt: string;
}

interface ExpandResponse {
  history: FileDetail[];
  totalSize: number;
  totalFiles: number;
}

// Add skeleton componentc
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

function FileDetailsAccordion({ shareId, slug }: { shareId: string; slug: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const { data, isLoading, error } = useQuery({
        queryKey: ['file-details', shareId],
        queryFn: async () => {
            const response = await axios.get<ExpandResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/v1/history/expand/${shareId}`,
                { withCredentials: true }
            );
            return response.data;
        },
        enabled: isExpanded,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="mt-3">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
                <ChevronRight 
                    className={`h-4 w-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : 'rotate-0'
                    }`} 
                />
                <FolderOpen className="h-4 w-4" />
                Szczegóły plików
            </button>

            {isExpanded && !isLoading && (
                <div className="mt-3 p-3 bg-zinc-900/20 border border-zinc-800 rounded-md animate-slide-in-bottom-low-delay">
                    {error ? (
                        <div className="text-red-400 text-sm">
                            Błąd podczas ładowania szczegółów
                        </div>
                    ) : data ? (
                        <div className="space-y-3">
                            {data.totalFiles === 0 ? (
                                <div className="text-zinc-400 text-sm flex items-center gap-2">
                                    <FileIcon className="h-4 w-4" />
                                    Brak plików lub zostały usunięte
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between text-sm border-b border-zinc-800 pb-2 border-dashed">
                                        <span className="text-zinc-400">
                                            Plików: <span className="text-zinc-200 font-medium">{data.totalFiles}</span>
                                        </span>
                                        <span className="text-zinc-400">
                                            Rozmiar: <span className="text-zinc-200 font-medium">{formatFileSize(data.totalSize)}</span>
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2 max-h-32 overflow-y-auto ">
                                        {data.history.map((file) => (
                                            <div 
                                                key={file.id}
                                                className="flex items-center gap-2 px-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                                            >
                                                <FileIcon className="h-4 w-4 text-zinc-500" />
                                                <span className="truncate flex-1">{file.fileName}</span>
                                                <span className="text-xs text-zinc-500">{formatFileSize(file.size)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

export default function RecentShareCard({ slug, createdAt, expiresAt, private: isPrivate, id }: ShareCardProps) {
  return (
    <div className="border border-dashed border-zinc-800 rounded-md p-4 bg-zinc-950/10 hover:bg-zinc-950/20 transition-colors w-full animate-slide-in-bottom mt-2 tracking-tight">
      <div className="flex justify-between items-center">
        <div className="flex">
          <span className="text-zinc-400 text-md font-medium flex items-center ">
            dajkodzik.pl/<span className="text-zinc-300 break-all whitespace-pre-wrap">{slug}</span> {isPrivate ? <Lock className="h-4 w-4 text-zinc-400 ml-2" /> : null}
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
      
      {/* Add accordion for file details */}
      <FileDetailsAccordion shareId={id} slug={slug} />
    </div>
  );
}

// Update RecentShares component
export function RecentShares() {
  const { data: lastPosts, isLoading: isLastPostsLoading, isError: isLastPostsError } = useLastPosts();
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
          id={share.id}
        />
      ))}
    </div>
  );
}