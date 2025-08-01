"use client";

import React from 'react';
import { useInView } from 'react-intersection-observer';
import { UseInfiniteQueryResult } from '@tanstack/react-query';
import { Loader } from '@/components/dashboard/Loader';

interface InfiniteScrollProps {
    // Children to render
    children: React.ReactNode;
    // The data length to pass to react-infinite-scroll
    dataLength: number;
    // Function to call when more data needs to be loaded
    next: () => void;
    // Whether there are more items to load
    hasMore: boolean;
    // Optional custom loading component
    loader?: React.ReactNode;
    // Optional custom end message
    endMessage?: React.ReactNode;
    // Optional className for the container
    className?: string;
}

export default function InfiniteScroll({
    children,
    dataLength,
    next,
    hasMore,
    loader = <Loader />,
    endMessage = <p className="text-center py-4 text-gray-500">To wszystkie dostępne elementy.</p>,
    className = "",
}: InfiniteScrollProps) {
    const { ref, inView } = useInView();

    React.useEffect(() => {
        if (inView && hasMore) {
            next();
        }
    }, [inView, hasMore, next]);

    return (
        <div className={className}>
            {children}
            
            <div ref={ref} className="w-full">
                {hasMore && loader}
                {!hasMore && endMessage}
            </div>
        </div>
    );
}


// EXAMPLE USAGE:

/*

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['user-orders'],
        queryFn: async ({ pageParam = 0 }) => {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/v1/orders/retrieve/page/${pageParam}`,
                { credentials: 'include' }
            );
            const orders = await response.json();
            return orders;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => 
            lastPage.length === 4 ? allPages.length : undefined,
        initialData: {
            pages: [initialOrders],
            pageParams: [0],
        },
    });

    const allOrders = data?.pages.flat() ?? [];


     <InfiniteScroll
        dataLength={allOrders.length}
        next={fetchNextPage}
        hasMore={!!hasNextPage}
        loader={<Loader />}
        endMessage={
        <p className="text-center py-4 text-gray-500">
             Wszystkie zamówienia zostały załadowane.
        </p>
        }
    >
        {children}

    </InfiniteScroll>
*/