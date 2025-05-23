"use client";

import { useEffect, useState } from "react";
import { useFetch, Status } from "@/app/hooks/use-fetch";

export default function CheckStatus() {
    const [status, setStatus] = useState<Status>({
        message: 'loading',
        status: 0
    });
    const { status: statusData, isStatusLoading, isStatusError } = useFetch();

    useEffect(() => {
        if (isStatusError) {
            setStatus({ message: 'offline', status: 500 });
        } else if (statusData) {
            setStatus(statusData.status === 200 ? { message: 'online', status: 200 } : { message: 'offline', status: 500 });
        }
    }, [statusData, isStatusError]);

    return (
        <div className="flex items-center gap-2 text-sm animate-fade-in-01-text">
            <span className="relative flex h-2 w-2">
                {status.status === 0 ? (
                    <div className="animate-pulse rounded-full h-2 w-2 bg-zinc-500" />
                ) : (
                    <>
                        <span 
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                status.status === 200 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                        />
                        <span 
                            className={`relative inline-flex rounded-full h-2 w-2 ${
                                status.status === 200 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                        />
                    </>
                )}
            </span>
            <span className="text-zinc-400">
                {isStatusLoading ? 'Sprawdzanie...' :
                 status.status === 200 ? 'Serwer działa poprawnie' :
                 'Chwilowa przerwa techniczna'}
            </span>
        </div>
    );
}
