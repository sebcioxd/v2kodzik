import AuthTabs from "@/components/auth-tabs"
import getServerSession from "@/lib/server-session";
import { redirect } from "next/navigation";

const AuthenticationPage = async () => {
  // const session = await getServerSession();

  // if (session) {
  //   return redirect("/panel");
  // }

  return (
    <AuthTabs />
  )
}

export default AuthenticationPage