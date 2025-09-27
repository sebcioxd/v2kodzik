"use client";

import { ExternalLink, Clock, Lock, FolderOpen, ChevronRight, FileIcon, DownloadIcon, Eye, Calendar, CalendarDays, Code2 } from "lucide-react";
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
  views: number;
  id: string;
  count?: number;
  type?: "post" | "snippet";
  language?: string;
}

interface FileDetail {
  id: string;
  fileName: string;
  size: number;
  contentType: string;
  createdAt: string;
  downloadCount: number;
}

interface ExpandResponse {
  history: FileDetail[];
  totalSize: number;
  totalFiles: number;
}

// Custom date formatter for cards with numeric months
const formatCardDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() - (2 * 60 * 60 * 1000));
    return localDate.toLocaleDateString('pl-PL', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Data niedostępna';
  }
};

// Smart date optimization functions
const isToday = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() - (2 * 60 * 60 * 1000));
    const today = new Date();
    
    return localDate.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

const isSameDay = (date1: string, date2: string) => {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const localD1 = new Date(d1.getTime() - (2 * 60 * 60 * 1000));
    const localD2 = new Date(d2.getTime() - (2 * 60 * 60 * 1000));
    
    return localD1.toDateString() === localD2.toDateString();
  } catch (error) {
    return false;
  }
};

const formatTimeOnly = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() - (2 * 60 * 60 * 1000));
    return localDate.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Czas niedostępny';
  }
};

const formatDateOnly = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() - (2 * 60 * 60 * 1000));
    return localDate.toLocaleDateString('pl-PL', {
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    return 'Data niedostępna';
  }
};

// Smart date formatter that applies optimization when count === 3
const formatSmartDate = (createdAt: string, expiresAt: string, count: number) => {
  if (count !== 3) {
    return {
      created: formatCardDate(createdAt),
      expires: formatCardDate(expiresAt)
    };
  }

  const createdIsToday = isToday(createdAt);
  const expiresIsToday = isToday(expiresAt);
  const sameDay = isSameDay(createdAt, expiresAt);

  // Algorithm 1: Cut time when dates are different
  if (!sameDay) {
    return {
      created: formatDateOnly(createdAt),
      expires: formatDateOnly(expiresAt)
    };
  }

  // Algorithm 2: Cut dates when time is today (show only time)
  if (createdIsToday && expiresIsToday) {
    return {
      created: formatTimeOnly(createdAt),
      expires: formatTimeOnly(expiresAt)
    };
  }

  // Fallback to normal formatting
  return {
    created: formatCardDate(createdAt),
    expires: formatCardDate(expiresAt)
  };
};

// Add skeleton component
export function RecentSharesSkeleton() {
  return (
    <div className="w-full grid md:grid-cols-3 grid-cols-1 gap-4 animate-slide-in-bottom">
      {[1, 2, 3].map((i) => (
        <div 
          key={i}
          className="border border-dashed border-zinc-800 rounded-lg p-4 bg-zinc-950/10 hover:bg-zinc-950/20 transition-all duration-200"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded bg-zinc-800" />
              <Skeleton className="h-4 w-24 bg-zinc-800" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md bg-zinc-800" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-32 bg-zinc-800" />
            <Skeleton className="h-3 w-28 bg-zinc-800" />
            <Skeleton className="h-3 w-24 bg-zinc-800" />
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
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="mt-2">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
                <ChevronRight 
                    className={`h-3 w-3 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : 'rotate-0'
                    }`} 
                />
                <FolderOpen className="h-4 w-4" />
                <span className="hover:text-zinc-300">Podgląd plików</span>
            </button>   

            {isExpanded && !isLoading && (
                <div className="mt-1.5 p-2 bg-zinc-900/30 border border-zinc-800/50 rounded-md animate-slide-in-bottom-low-delay">
                    {error ? (
                        <div className="text-red-400 text-sm flex items-center gap-1">
                            <FileIcon className="h-3 w-3" />
                            Błąd ładowania
                        </div>
                    ) : data ? (
                        <div className="space-y-1.5">
                            {data.totalFiles === 0 ? (
                                <div className="text-zinc-500 text-sm flex items-center gap-1">
                                    <FileIcon className="h-3 w-3" />
                                    Brak plików
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between text-sm border-b border-zinc-800/50 pb-1">
                                        <span className="text-zinc-500">
                                            {data.totalFiles} plików
                                        </span>
                                        <span className="text-zinc-500">
                                            {formatFileSize(data.totalSize)}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-1.5 max-h-24 overflow-y-auto">
                                        {data.history.slice(0, 3).map((file) => (
                                            <div 
                                                key={file.id}
                                                className="flex items-center gap-1.5 px-1 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                                            >
                                                <FileIcon className="h-3 w-3 text-zinc-600 flex-shrink-0" />
                                                  <span className="truncate flex-1 text-sm">{file.fileName}</span>
                                                <div className="flex items-center gap-0.5 text-zinc-600">
                                                    <DownloadIcon className="h-3 w-3" />
                                                    <span className="text-sm">{file.downloadCount}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {data.history.length > 3 && (
                                            <div className="text-sm text-zinc-600 text-center pt-0.5">
                                                +{data.history.length - 3} więcej
                                            </div>
                                        )}
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

// Add language badge component
const LanguageBadge = ({ language }: { language: string }) => {
  return (
    <div className="px-2 py-1 text-xs rounded-md bg-zinc-900/50 text-zinc-400 border border-dashed border-zinc-700 w-full flex items-center gap-1.5 ">
      <div className="w-2 h-2 rounded-full text-md bg-zinc-400" />
      {language}  
    </div>
  );
};

export default function RecentShareCard({ 
  slug, 
  createdAt, 
  expiresAt, 
  private: isPrivate, 
  id, 
  views, 
  count = 1, 
  type = "post",
  language 
}: ShareCardProps) {
  const smartDates = formatSmartDate(createdAt, expiresAt, count);
  const isSnippet = type === "snippet";
  
  return (
    <div className="border border-dashed border-zinc-800 rounded-sm p-4 bg-zinc-950/10 hover:bg-zinc-950/20 transition-all duration-200 w-full animate-slide-in-bottom group">
      {/* Header with slug and external link */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full flex-shrink-0"></div>
          <span className="text-zinc-300 text-md truncate">
            {slug}
          </span>
          {isPrivate && <Lock className="h-4 w-4 text-zinc-400 flex-shrink-0" />}
          {isSnippet && <Code2 className="h-5 w-5 text-zinc-400 flex-shrink-0" />}
        </div>
        <Link
          href={isSnippet ? `/s/${slug}` : `/${slug}`}
          className="text-zinc-500 hover:text-zinc-300 text-md hover:bg-zinc-800/50 p-1.5 rounded-md transition-all duration-200 flex-shrink-0 flex items-center gap-1"
        > 
          <ExternalLink className="h-4 w-4" /> 
        </Link>
      </div>

      {/* Stats in a clean grid */}
      <div className="flex items-center gap-4 mb-2">
        {!isSnippet && (
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <Eye className="h-3 w-3" />
            <span>{views}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-sm text-zinc-500">
          <Calendar className="h-3 w-3" />
          <span>{smartDates.created}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-zinc-500">
          <CalendarDays className="h-3 w-3" />
          <span>{smartDates.expires}</span>
        </div>
      </div>
      
      {/* Language badge for snippets or file details for posts */}
      {isSnippet && language ? (
        <div className="mt-2">
          <LanguageBadge language={language} />
        </div>
      ) : !isSnippet ? (
        <FileDetailsAccordion shareId={id} slug={slug} />
      ) : null}
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
          views={share.views}
          count={count}
          type={share.type}
          language={share.language}
        />
      ))}
    </div>
  );
}