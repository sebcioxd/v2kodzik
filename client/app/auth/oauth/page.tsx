import { Suspense } from "react";
import OAuth from "@/components/auth/oauth";

export default function OAuthPage() {
    return (
        <Suspense fallback={
            <div className="md:my-30 my-10 flex items-center justify-center bg-darken">
                <div className="text-center space-y-4">
                    <div className="h-8 w-8 animate-spin mx-auto text-zinc-400 border-2 border-zinc-400 border-t-transparent rounded-full" />
                    <h1 className="text-xl font-medium text-zinc-200">
                        Ładowanie...
                    </h1>
                    <p className="text-zinc-400">Prosimy o chwilkę...</p>
                </div>
            </div>
        }>
            <OAuth />
        </Suspense>
    )
}
