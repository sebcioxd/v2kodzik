"use client";

import { useEffect, useState } from "react";

export default function CheckStatus() {
    const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/status`);
                setStatus(response.status === 200 ? 'online' : 'offline');
            } catch (error) {
                setStatus('offline');
            }
        };

        checkStatus();
    }, []);

    return (
        <div className="flex items-center gap-2 text-sm animate-fade-in-01-text">
            <span className="relative flex h-2 w-2">
                {status === 'loading' ? (
                    <div className="animate-pulse rounded-full h-2 w-2 bg-zinc-500" />
                ) : (
                    <>
                        <span 
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                status === 'online' ? 'bg-green-500' : 'bg-red-500'
                            }`}
                        />
                        <span 
                            className={`relative inline-flex rounded-full h-2 w-2 ${
                                status === 'online' ? 'bg-green-500' : 'bg-red-500'
                            }`}
                        />
                    </>
                )}
            </span>
            <span className="text-zinc-400">
                {status === 'loading' ? 'Sprawdzanie...' :
                 status === 'online' ? 'API działa poprawnie' :
                 'Chwilowa przerwa techniczna'}
            </span>
        </div>
    );
}
