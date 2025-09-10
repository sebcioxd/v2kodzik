"use client";

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Clock, 
  ExternalLink, 
  Lock, 
  Link as LinkIcon, 
  CalendarArrowDown, 
  CalendarArrowUp,
  History,
  File,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/date';
import InfiniteScroll from './InfiniteScroll';
import { User } from '@/lib/auth-client';
import { useState } from 'react';

export type Share = {
    id: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    userId: string;
    code: string;
    private: boolean;
    views: number;
}

type FileDetail = {
    id: string;
    fileName: string;
    size: number;
    contentType: string;
    createdAt: string;
}

type ExpandResponse = {
    history: FileDetail[];
    totalSize: number;
    totalFiles: number;
}

type APIResponse = {
    history: Share[];
    user: any;
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
                                    <File className="h-4 w-4" />
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
                                                <File className="h-4 w-4 text-zinc-500" />
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

export default function ShareHistory({ user }: { user: User }) {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error
    } = useInfiniteQuery({
        queryKey: ['user-history'],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await axios.get<APIResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/v1/history`,
                {
                    params: {
                        page: pageParam,
                        limit: 6
                    },
                    withCredentials: true,
                }
            );
            return response.data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.history.length === 6 ? allPages.length + 1 : undefined;
        },
        enabled: !!user,
        staleTime: 0, // Data is always considered stale
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    const allShares = data?.pages.flatMap(page => page.history) ?? [];

    const isExpired = (expiresAt: string) => {
        const exp = new Date(expiresAt).getTime() - (2 * 60 * 60 * 1000);
        const now = Date.now();
        
        return !Number.isNaN(exp) && exp <= now;
    };

    // Don't show anything while loading initially
    if (isLoading && allShares.length === 0) {
        return null;
    }

    if (error) {
        return (
            <main className="flex items-center justify-center min-h-[400px]">
                <div className="text-red-400">Błąd podczas ładowania historii</div>
            </main>
        );
    }

    return (
        <main className="">
            <div className="w-full space-y-3 animate-fade-in-01-text">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h2 className="text-xl text-zinc-200 font-medium tracking-tight flex items-center gap-2">
                        <History className="h-5 w-5 text-zinc-400" />
                        Historia plików
                    </h2>
                </div>

                <div className="border-b border-zinc-800 pb-6">
                    <InfiniteScroll
                        dataLength={allShares.length}
                        next={fetchNextPage}
                        hasMore={!!hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        endMessage={
                            <p className="text-left py-4 text-zinc-500 text-sm">
                                To wszystkie wygenerowane pliki.
                            </p>
                        }
                    >
                        <div className="space-y-4">
                            {allShares.length === 0 && !isLoading && (
                                <div className="text-zinc-400 text-sm">
                                    Brak udostępnień.{" "}
                                    <Link 
                                        href="/upload" 
                                        className="text-zinc-200 hover:bg-zinc-800 rounded-md px-2 py-1 transition-colors inline-flex items-center gap-1"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Dodaj nowe pliki
                                    </Link>
                                </div>
                            )}
                            
                            {allShares.map((share) => {
                                const expired = isExpired(share.expiresAt);

                                return (
                                <div 
                                    key={share.id}
                                    className="bg-zinc-900/30 border border-zinc-900 border-dashed rounded-md p-4 hover:bg-zinc-900/20 transition-colors animate-slide-in-bottom"
                                >
                                    <div className="flex justify-between items-center mb-2 border-b border-zinc-900 pb-2">
                                        <div className="flex flex-col">
                                            <span className="text-zinc-400 text-sm font-medium flex flex-row gap-1 items-center">
                                                <LinkIcon className="h-4 w-4" /> 
                                                Kod linku:<span className="text-zinc-200">{share.slug}</span> 
                                                {share.private && <Lock className="h-4 w-4 text-zinc-400" />}
                                                
                                            </span>
                                        </div>
                                        {expired ? (
                                            <span className="text-red-200 bg-zinc-950/40 border border-zinc-900 rounded-md px-3 py-1 text-sm flex items-center gap-2">
                                                <Lock className="h-4 w-4" />
                                                Niedostępny
                                            </span>
                                        ) : (
                                            <Link
                                                href={`/${share.slug}`}
                                                className="text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-900/80 rounded-md px-3 py-1 flex items-center gap-2 transition-colors"
                                            > 
                                                <ExternalLink className="h-4 w-4" /> 
                                                Odwiedź
                                            </Link>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 text-sm text-zinc-400 pt-2">
                                        <span className="flex items-center gap-2">
                                            <CalendarArrowUp className="h-4 w-4 text-zinc-200" /> 
                                            Utworzono: {formatDate(share.createdAt)}
                                        </span>
                                        <span className={`flex items-center gap-2 ${expired ? 'text-red-300' : ''}`}>
                                            <CalendarArrowDown className="h-4 w-4 text-zinc-200" /> 
                                            {expired ? 'Wygasł:' : 'Wygasa:'} {formatDate(share.expiresAt)}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Eye className="h-4 w-4 text-zinc-200" /> 
                                            Wyświetlenia: {share.views.toLocaleString('pl-PL')}
                                        </span>
                                    </div>
                                    
                                    <FileDetailsAccordion shareId={share.id} slug={share.slug} />
                                </div>
                                );
                            })}
                        </div>
                    </InfiniteScroll>
                </div>
            </div>
        </main>
    );
}