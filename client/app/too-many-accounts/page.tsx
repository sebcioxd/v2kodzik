"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function TooManyAccountsRedirectPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.replace("/too-many-accounts/flagged");
      return;
    }

    if (session && !isSigningOut) {
      setIsSigningOut(true);

      const handleSignOutAndRedirect = async () => {
        try {
          await authClient.signOut({
            fetchOptions: {
              credentials: "include",
            },
          });
          router.replace("/too-many-accounts/flagged");
        } catch (error) {
          console.error("Logout process failed, redirecting anyway:", error);
          router.replace("/too-many-accounts/flagged");
        }
      };

      handleSignOutAndRedirect();
    }
  }, [isPending, session, router, isSigningOut]);

  if (isPending || (session && isSigningOut)) {
    return <>Ladowanie..</>;
  }

  return (
    <div className="items-center flex py-20 justify-center p-4">
      <p className="text-gray-500 text-center">
        Czesc, twoje konto zostalo zablokowane poniewaz przekroczyles limit
        zarejestrowanych kont w naszym serwisie.
        <br />
        Ta tresc zostala wykryta automatycznie.
        <br />
        Jesli uwazasz, ze popelnilismy blad, skontaktuj sie z nami mailowo.
      </p>
    </div>
  );
}
