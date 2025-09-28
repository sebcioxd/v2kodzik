import AuthTabs from "@/components/auth-tabs"
import getServerSession from "@/lib/server-session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

const AuthenticationPage = async () => {
  // const session = await getServerSession();

  // if (session) {
  //   return redirect("/panel");
  // }

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AuthTabs />
    </Suspense>
  )
}

export default AuthenticationPage