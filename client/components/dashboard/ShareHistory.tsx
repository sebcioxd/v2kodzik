"use client";

import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader } from './Loader';
import { 
  Clock, 
  ExternalLink, 
  Lock, 
  Link as LinkIcon, 
  CalendarArrowDown, 
  CalendarArrowUp,
  History
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/date';
import InfiniteScroll from './InfiniteScroll';
import { User } from '@/lib/auth-client';

export type Share = {
    id: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    userId: string;
    code: string;
    private: boolean;
}

type APIResponse = {
    history: Share[];
    user: any;
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
                    {/* <h3 className="text-sm text-zinc-400 flex items-center gap-2 mb-4">
                        <Clock className="h-4 w-4" />
                        Twoja historia udostępnień plików
                    </h3> */}
                    
                    <InfiniteScroll
                        dataLength={allShares.length}
                        next={fetchNextPage}
                        hasMore={!!hasNextPage}
                        loader={isLoading ? <Loader /> : null}
                        endMessage={
                            <p className="text-left py-4 text-zinc-500 text-sm">
                                To wszystkie dostępne pliki.
                            </p>
                        }
                    >
                        <div className="space-y-4">
                            {allShares.length === 0 && !isLoading && (
                                <div className="text-zinc-400 text-sm">
                                    Brak udostępnień. {" "}
                                    <Link 
                                        href="/upload" 
                                        className="text-zinc-200 hover:bg-zinc-800 rounded-md px-2 py-1 transition-colors inline-flex items-center gap-1"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Dodaj nowe pliki
                                    </Link>
                                </div>
                            )}
                            
                            {allShares.map((share) => (
                                <div 
                                    key={share.id}
                                    className="bg-zinc-900/30 border border-zinc-900 rounded-md p-4 hover:bg-zinc-900/20 transition-colors animate-slide-in-bottom"
                                >
                                    <div className="flex justify-between items-center mb-2 border-b border-zinc-900 pb-2">
                                        <div className="flex flex-col">
                                            <span className="text-zinc-400 text-sm font-medium flex flex-row gap-2 items-center">
                                                <LinkIcon className="h-4 w-4" /> 
                                                Kod linku: <span className="text-zinc-200">{share.slug}</span> 
                                                {share.private && <Lock className="h-4 w-4 text-zinc-400" />}
                                            </span>
                                        </div>
                                        <Link
                                            href={`/${share.slug}`}
                                            className="text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-900/80 rounded-md px-3 py-1 flex items-center gap-2 transition-colors"
                                        > 
                                            <ExternalLink className="h-4 w-4" /> 
                                            Odwiedź
                                        </Link>
                                    </div>
                                    <div className="flex flex-col gap-2 text-sm text-zinc-400 pt-2">
                                        <span className="flex items-center gap-2">
                                            <CalendarArrowUp className="h-4 w-4 text-zinc-200" /> 
                                            Utworzono: {formatDate(share.createdAt)}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <CalendarArrowDown className="h-4 w-4 text-zinc-200" /> 
                                            Wygasa: {formatDate(share.expiresAt)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </InfiniteScroll>
                </div>
            </div>
        </main>
    );
}
