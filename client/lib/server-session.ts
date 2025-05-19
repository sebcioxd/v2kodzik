import { cookies } from "next/headers";
import { Session } from "./auth-client";

const getServerSession = async (): Promise<Session | null> => {
  try {

    const cookieHeader = (await cookies()).toString();

    const res = await fetch(`${process.env.BETTER_AUTH_URL}/v1/session`, {
      credentials: "include",
      headers: {
        Cookie: cookieHeader,
      },
    });

    return res.json();

  } catch (error) {
    console.error(error);
    return null;
  }
};

export default getServerSession;