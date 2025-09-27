import OAuthPasswordSetup from "@/components/auth/oauth-password";
import getServerSession from "@/lib/server-session";
import { redirect } from "next/navigation";


export default async function OAuthPasswordPage() {
    const session = await getServerSession();

    if (!session) {
        redirect("/auth");
    }

    if (!session.user.oauth) {
        redirect("/panel");
    }


    return <OAuthPasswordSetup />
}
