"use client";
import React from 'react';
import { useInView } from 'react-intersection-observer';

interface InfiniteScrollProps {
    // Children to render
    children: React.ReactNode;
    // The data length to pass to react-infinite-scroll
    dataLength: number;
    // Function to call when more data needs to be loaded
    next: () => void;
    // Whether there are more items to load
    hasMore: boolean;
    // Whether currently fetching next page (from React Query)
    isFetchingNextPage: boolean;
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
    isFetchingNextPage,
    endMessage = <p className="text-center py-4 text-gray-500">To wszystkie dostępne elementy.</p>,
    className = "",
}: InfiniteScrollProps) {
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '200px', // Load more when element is 200px away from viewport
    });

    // Trigger next page fetch when:
    // 1. Trigger element is in view
    // 2. There are more pages to load
    // 3. Not currently fetching
    // 4. We have some data already (prevents initial double load)
    React.useEffect(() => {
        if (inView && hasMore && !isFetchingNextPage && dataLength > 0) {
            next();
        }
    }, [inView, hasMore, isFetchingNextPage, next, dataLength]);

    return (
        <div className={className}>
            {children}
            
            {/* Intersection observer target */}
            <div ref={ref} className="w-full">
                {!hasMore && endMessage}
            </div>
        </div>
    );
}