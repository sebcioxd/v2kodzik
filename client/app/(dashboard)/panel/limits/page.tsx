"use client";

import Limits from "@/components/dashboard/Limits";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LimitsPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    if (!session && !isPending) {
        router.push("/auth");
    }

    return (
        <main className="">
            {session && !isPending && (
                <Limits user={session.user} />
            )}
        </main>
    );
}
