import UserPanel from "@/components/user-panel";
import getServerSession from "@/lib/server-session";
import { redirect } from "next/navigation";
import axios from "axios";
import { cookies } from "next/headers";
import { User } from "@/lib/auth-client";
import Pagination from "@/components/pagination";

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

type Params = Promise<{ page: string, search: string }> 

export default async function UserPanelPage({ searchParams }: { searchParams: Params }) {
    const session = await getServerSession();

    if (!session) {
        return redirect("/auth");
    }

    const { page, search } = await searchParams;

    const currentPage = page ? Number.parseInt(page) : 1
    const currentSearch = search ? search : ""
    const sharesPerPage = 4 

    const countResponse = await axios.get(`${process.env.BETTER_AUTH_URL}/v1/history/count`, {
        headers: {
            Cookie: (await cookies()).toString()
        },
        withCredentials: true,
    })

    const totalPages = Math.ceil(countResponse.data.count / sharesPerPage)


    const response = await axios.get<APIResponse>(`${process.env.BETTER_AUTH_URL}/v1/history`, {
        params: {
            page: currentPage,
            limit: sharesPerPage
        },
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
            {totalPages > 1 && (
                <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    baseUrl="/panel"
                />
            )}
        </main>
    )
}
