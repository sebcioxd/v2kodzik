"use client"
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useQueryState } from "nuqs";
import { Suspense } from "react";

function NotFoundContent() {
    const [returnUrl] = useQueryState("returnUrl");

    return (
        <div className="flex flex-col items-center justify-center my-10">
            <h1 className="text-3xl text-zinc-400 tracking-tight mb-4 animate-fade-in-01-text">Nie znaleziono szukanej strony</h1>
            <Link href={returnUrl || "/"} className="text-zinc-400 hover:text-zinc-100 animate-slide-in-left flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Powrót do poprzedniej strony
            </Link>  
        </div>
    )
}

export default function NotFoundComponent() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center my-10">
                <div className="h-8 w-8 animate-spin mx-auto text-zinc-400 border-2 border-zinc-400 border-t-transparent rounded-full" />
                <p className="text-zinc-400">Prosimy o chwilkę...</p>
            </div>
        }>
            <NotFoundContent />
        </Suspense>
    )
}
