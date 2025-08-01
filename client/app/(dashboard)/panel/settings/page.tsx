"use client";

import Settings from "@/components/dashboard/Settings";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    if (!session && !isPending) {
        router.push("/auth");
    }

    return (
        <main className="">
            {session && !isPending && (
                <Settings user={session.user} />
            )}
        </main>
    );
}
