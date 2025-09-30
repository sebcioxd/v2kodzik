"use client";

import Limits from "@/components/dashboard/Limits";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useQuery } from '@tanstack/react-query';

// Type for the API response
type LimitsData = {
  success: boolean;
  megabytesUsed: number;
  megabytesLimit: number;
  message: string;
  resetAt?: string;
  linksGenerated: number;
  filesUploaded: number;
  lifetimeMegabytesUsed: number;
};

export default function LimitsPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    // Fetch limits data at page level
    const {
        data: limitsData,
        isLoading: limitsLoading,
        error: limitsError,
    } = useQuery<LimitsData, Error>({
        queryKey: ['user-limits'],
        queryFn: async (): Promise<LimitsData> => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/v1/limits/check`,
                    {
                        credentials: 'include',
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('Error fetching limits:', error);
                throw error;
            }
        },
        enabled: !!session?.user,
        staleTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    if (!session && !isPending) {
        router.push("/auth");
    }

    // Don't render anything until both session and limits data are loaded
    if (isPending || !session || limitsLoading || !limitsData) {
        return null;
    }

    // Show error state if limits data failed to load
    if (limitsError) {
        return (
            <main className="flex items-center justify-center min-h-[400px]">
                <div className="text-red-400">Błąd podczas ładowania limitów</div>
            </main>
        );
    }

    return (
        <main className="">
            <Limits user={session.user} limitsData={limitsData} />
        </main>
    );
}
