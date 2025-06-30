"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface apiResponse {
    remoteAdress: string;
    remoteAdress_v6: string;
    userAgent: string;
    referer: string;
    nodeVersion: string;
    port: number;
    transport: string;
    host: string;
}

export default function OAuth() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isVerifying, setIsVerifying] = useState(true);
    const redirect = searchParams.get('redirect') || '/';
    const oauth = searchParams.get('oauth') || false;

    useEffect(() => {
        const verifyUser = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/info`)
                const visitorInfo: apiResponse = await response.json();
                console.log(visitorInfo)

                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/update`, {
                    method: 'POST',
                    credentials: 'include',
                    body: JSON.stringify({
                        remoteAdress: visitorInfo.remoteAdress,
                        userAgent: visitorInfo.userAgent,
                    }),
                });

                if (oauth) { 
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/oauth/set`, {
                        method: 'POST',
                        credentials: 'include',
                    });
                }

                router.push(`${process.env.NEXT_PUBLIC_SITE_URL}/${redirect}`);
            } catch (error) {
                console.error('Verification error:', error);
                setIsVerifying(false);
            }
        };

        verifyUser();
    }, [redirect, router]);

    return (
        <div className="md:my-30 my-10flex items-center justify-center bg-darken">
            <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-400" />
                <h1 className="text-xl font-medium text-zinc-200">
                    Weryfikujemy twoje konto
                </h1>
                <p className="text-zinc-400">
                    Prosimy o chwilkę...
                </p>
            </div>
        </div>
    );
}