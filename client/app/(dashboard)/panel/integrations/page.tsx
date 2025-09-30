"use client";

import Integrations from "@/components/dashboard/Integrations";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useQuery } from '@tanstack/react-query';

// Updated type to match the actual structure returned by listAccounts
type Account = {
  id: string;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
  accountId: string;
  scopes: string[];
};

export default function IntegrationsPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    // Fetch accounts data at page level
    const {
        data: accounts,
        isLoading: accountsLoading,
        error: accountsError,
    } = useQuery<Account[], Error>({
        queryKey: ['user-accounts'],
        queryFn: async (): Promise<Account[]> => {
            try {
                const result = await authClient.listAccounts();
                return result.data ?? [];
            } catch (error) {
                console.error('Error fetching accounts:', error);
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

    // Don't render anything until both session and accounts data are loaded
    if (isPending || !session || accountsLoading || !accounts) {
        return null;
    }

    // Show error state if accounts data failed to load
    if (accountsError) {
        return (
            <main className="flex items-center justify-center min-h-[400px]">
                <div className="text-red-400">Błąd podczas ładowania integracji</div>
            </main>
        );
    }

    return (
        <main className="">
            <Integrations user={session.user} accounts={accounts} />
        </main>
    );
}
