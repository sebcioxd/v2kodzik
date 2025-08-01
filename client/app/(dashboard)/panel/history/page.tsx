"use client";

import ShareHistory from "@/components/dashboard/ShareHistory";
import { useSession } from "@/lib/auth-client";
import { User } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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
    user: User;
}

export default function ShareHistoryPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    if (!session && !isPending) {
        router.push("/auth");
    }

    return (
        <main className="">
            {session && !isPending && (
                <ShareHistory user={session.user} />
            )}
        </main>
    );
}
