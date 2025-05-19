import UserPanel from "@/components/user-panel";
import getServerSession from "@/lib/server-session";
import { redirect } from "next/navigation";
import axios from "axios";
import { cookies } from "next/headers";
import { User } from "@/lib/auth-client";

export const dynamic = "force-dynamic";

type History = {
    id: string;
    shareId: string;
    fileName: string;
    size: number;
    storagePath: string;
    createdAt: string;
    updatedAt: string;
}

type HistoryResponse = {
    uploaded_files: History;
    shares: {
        id: string;
        slug: string;
        createdAt: string;
        updatedAt: string;
        expiresAt: string;
        userId: string;
    };
}

type UserPanelResponse = {
    history: HistoryResponse[];
    user: User;
}

export default async function UserPanelPage() {
    const session = await getServerSession();

    if (!session) {
        return redirect("/auth");
    }

    const history = await axios.get<UserPanelResponse>("http://localhost:8080/v1/history", {
        headers: {
            Cookie: (await cookies()).toString()
        },
        withCredentials: true,
    })

    return (
        <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-xl max-w-sm pt-10">
            <UserPanel history={history.data.history} user={history.data.user}/>
    
        </main>
    )
}
