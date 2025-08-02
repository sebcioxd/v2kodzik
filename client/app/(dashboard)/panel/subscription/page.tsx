"use client";

import Subscriptions from "@/components/dashboard/Subscriptions";
import { useSession } from "@/lib/auth-client";
import { User } from "@/lib/auth-client";
import { useRouter } from "next/navigation";


export default function ShareHistoryPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    if (!session && !isPending) {
        router.push("/auth");
    }

    return (
        <main className="">
            {session && !isPending && (
                <Subscriptions user={session.user} />
            )}
        </main>
    );
}
