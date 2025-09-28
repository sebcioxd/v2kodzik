"use client";

import Security from "@/components/dashboard/Security";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";


export default function SecurityPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    if (!session && !isPending) {
        router.push("/auth");
    }

    return (
        <main className="">
            {session && !isPending && (
                <Security user={session.user} />
            )}
        </main>
    );
}
