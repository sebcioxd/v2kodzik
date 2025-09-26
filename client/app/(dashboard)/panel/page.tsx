"use client";

import Overview from "@/components/dashboard/Overview";
import { useSession } from "@/lib/auth-client";
import { User } from "@/lib/auth-client";
import { useRouter } from "nextjs-toploader/app";

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

export default function UserPanelPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    if (!session && !isPending) {
        router.push("/auth");
    }

    return (
        <main className="">
            {session && !isPending && (
                <Overview user={session.user} />
            )}
        </main>
    );
}
