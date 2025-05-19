import UserPanel from "@/components/user-panel";
import getServerSession from "@/lib/server-session";
import { redirect } from "next/navigation";
import axios from "axios";
import { cookies } from "next/headers";
import { User } from "@/lib/auth-client";

type Share = {
    id: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    userId: string;
}

type HistoryItem = {
    uploaded_files: {
        id: string;
        shareId: string;
        fileName: string;
        size: number;
        storagePath: string;
        createdAt: string;
        updatedAt: string;
    };
    shares: Share;
}

type APIResponse = {
    history: HistoryItem[];
    user: User;
}

export default async function UserPanelPage() {
    const session = await getServerSession();

    if (!session) {
        return redirect("/auth");
    }

    const response = await axios.get<APIResponse>(`${process.env.BETTER_AUTH_URL}/v1/history`, {
        headers: {
            Cookie: (await cookies()).toString()
        },
        withCredentials: true,
    });

    // Get unique shares by using the share ID as a key
    const uniqueShares = Object.values(
        response.data.history.reduce((acc, item) => {
            if (!acc[item.shares.id]) {
                acc[item.shares.id] = item.shares;
            }
            return acc;
        }, {} as Record<string, Share>)
    );

    return (
        <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-xl max-w-sm pt-10">
            <UserPanel shares={uniqueShares} user={response.data.user} />
        </main>
    )
}
