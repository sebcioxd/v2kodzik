"use client";

import SnippetsHistory from "@/components/dashboard/SnippetsHistory";
import { useSession } from "@/lib/auth-client";
import { User } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export type Snippet = {
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
    snippets: Snippet[];
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
                <SnippetsHistory user={session.user} />
            )}
        </main>
    );
}
