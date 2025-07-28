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

type APIResponse = {
    history: Share[];
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

    const shares = response.data.history;

    return (
        <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-xl max-w-sm pt-10">
            <UserPanel shares={shares} user={response.data.user} />
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
