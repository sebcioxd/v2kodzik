"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useFetch } from "@/app/hooks/use-fetch";

export default function OAuth() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const redirect = searchParams.get("redirect") || "/";
  const oauth = searchParams.get("oauth") || false;

  const {
    info,
    isInfoLoading,
    isInfoError,
    update,
    isUpdateLoading,
    isUpdateError,
    oauth: oauthData,
    isOauthLoading,
    isOauthError,
  } = useFetch();

  useEffect(() => {
    const shouldRedirectToOAuth =
      !isInfoLoading &&
      !isUpdateLoading &&
      !isOauthLoading &&
      !isInfoError &&
      !isUpdateError &&
      !isOauthError;

    if (shouldRedirectToOAuth) {
      if (oauth && oauthData) {
        router.push(`${process.env.NEXT_PUBLIC_SITE_URL}/oauth-password`);
      } else {
        router.push(`${process.env.NEXT_PUBLIC_SITE_URL}/${redirect}`);
      }
    }

    if (isInfoError || isUpdateError || isOauthError) {
      setIsVerifying(false);
    }
  }, [
    isInfoLoading,
    isUpdateLoading,
    isOauthLoading,
    isInfoError,
    isUpdateError,
    isOauthError,
    oauth,
    oauthData,
    redirect,
    router,
  ]);

  if (!isVerifying) {
    return (
      <div className="md:my-30 my-10 flex items-center justify-center bg-darken">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-medium text-red-400">
            Wystąpił błąd podczas weryfikacji
          </h1>
          <p className="text-zinc-400">Spróbuj ponownie później</p>
        </div>
      </div>
    );
  }

  return (
    <div className="md:my-30 my-10 flex items-center justify-center bg-darken">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-400" />
        <h1 className="text-xl font-medium text-zinc-200">
          Weryfikujemy twoje konto
        </h1>
        <p className="text-zinc-400">Prosimy o chwilkę...</p>
      </div>
    </div>
  );
}
