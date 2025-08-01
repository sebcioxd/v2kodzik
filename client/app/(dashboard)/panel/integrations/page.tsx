"use client";

import Integrations from "@/components/dashboard/Integrations";
import { useSession } from "@/lib/auth-client";
import { User } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function IntegrationsPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    if (!session && !isPending) {
        router.push("/auth");
    }

    return (
        <main className="">
            {session && !isPending && (
                <Integrations user={session.user} />
            )}
        </main>
    );
}
