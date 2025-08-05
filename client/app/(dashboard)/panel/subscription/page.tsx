"use client";

import Subscriptions from "@/components/dashboard/Subscriptions";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { authClient } from '@/lib/auth-client';
import { useState, useEffect } from 'react';

// Type for subscription data from better-auth/stripe
type Subscription = {
  id: string;
  plan: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialStart?: string;
  trialEnd?: string;
  seats?: number;
  stripeCustomerId?: string; // This is the actual property name
};

export default function SubscriptionPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscriptions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await authClient.subscription.list();
            
            setSubscriptions(result.data as unknown as Subscription[]);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            setError('Błąd podczas ładowania subskrypcji');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchSubscriptions();
        }
    }, [session?.user]);

    if (!session && !isPending) {
        router.push("/auth");
    }

    return (
        <main className="">
            {session && !isPending && (
                <Subscriptions 
                    user={session.user} 
                    subscriptions={subscriptions}
                    isLoading={isLoading}
                    error={error}
                />
            )}
        </main>
    );
}
