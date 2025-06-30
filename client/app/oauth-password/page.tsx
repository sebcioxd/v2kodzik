import OAuthPasswordSetup from "@/components/auth/oauth-password";
import getServerSession from "@/lib/server-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";


export default async function OAuthPasswordPage() {
    const session = await getServerSession();
    const cookieHeader = (await cookies()).toString();

    if (!session) {
        redirect("/auth");
    }

    if (!session.user.oauth) {
        redirect("/panel");
    }

    const checkForOAuthStatus = await fetch(`${process.env.BETTER_AUTH_URL}/v1/oauth/set`, {
        credentials: "include",
        method: "POST",
        headers: {
          Cookie: cookieHeader,
        },
      });

    if (checkForOAuthStatus.status === 400) {
        redirect("/panel");
    }

    return <OAuthPasswordSetup />
}
