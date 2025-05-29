"use client"
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Link as LinkIcon, History, AlertCircle } from "lucide-react";
import { RecentShares } from "./link-comp";
import { useSession } from "@/lib/auth-client";

export default function Hero() {
  const { data: session } = useSession();
    return (
    <main className="flex flex-col items-center justify-center">
        <Image src="/logo-no-bg.png" alt="Hero" width={200} height={200} className="opacity-50 animate-fade-in-01-image opacity-0"/>
        <h1 className="md:text-3xl text-2xl text-zinc-100 tracking-tight mb-4 animate-fade-in-01-text opacity-0 text-center">Przesyłaj pliki w mgnieniu oka.</h1>
        <p className="text-zinc-500 text-md text-wrap max-w-xl text-center animate-slide-in-left opacity-0">
            Dzięki wygodnemu interfejsowi, przesyłanie plików jest niezwykle proste. Użyj naszego serwisu do przesyłania plików i zyskaj wiele czasu. Możesz w łatwy sposób generować linki niestandardowe, skracając czas drugiej osoby.
        </p>

        
        <section className="flex flex-row gap-4">
        <Link href="/upload" className="flex items-center hover:cursor-pointer">
            <Button className="mt-4 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:cursor-pointer animate-slide-in-bottom">
                
                    Przejdź do przesyłania
                <ArrowRight className="w-4 h-4 ml-2" />
            
        </Button>
        </Link>
        <Link href="/search" className="flex items-center hover:cursor-pointer">
        <Button className="mt-4 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:cursor-pointer animate-slide-in-bottom">
            
                Dostałem link
                <LinkIcon className="w-4 h-4 ml-2" />
            </Button>
        </Link>

        </section>

        {!session && (
        <div className="mt-8 p-3 border-b border-dashed border-zinc-800 animate-slide-in-bottom">
            <p className="text-zinc-400 text-sm flex items-center gap-2">
                <span><AlertCircle className="w-4 h-4" /></span>
                <span>Zaloguj się, aby zobaczyć historię przesyłanych plików.</span>
                <Link href="/auth" className="text-zinc-300 hover:text-zinc-100 transition-colors underline underline-offset-4">
                    Zaloguj
                </Link>
            </p>
        </div>
        )}

        <div className="mt-8  animate-slide-in-bottom self-start">
           <p className="text-zinc-400 text-sm flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>Ostatnio wygenerowane linki</span>
           </p>
        </div>
        <RecentShares />
    </main>
  )
}