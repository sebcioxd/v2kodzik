import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Link as LinkIcon } from "lucide-react";

export default function Hero() {
  return (
    <main className="flex flex-col items-center justify-center">
        <Image src="/logo-no-bg.png" alt="Hero" width={200} height={200} className="opacity-50 animate-fade-in-01-image opacity-0"/>
        <h1 className="text-3xl text-zinc-100 tracking-tight mb-4 animate-fade-in-01-text opacity-0 text-center">Przesyłaj pliki w mgnieniu oka.</h1>
        <p className="text-zinc-500 text-md text-wrap max-w-xl text-center animate-slide-in-left opacity-0">
            Dzięki wygodnemu interfejsowi, przesyłanie plików jest niezwykle proste. Użyj naszego serwisu do przesyłania plików i zyskaj wiele czasu. Możesz w łatwy sposób generować linki niestandardowe, skracając czas drugiej osoby.
        </p>

        
        <section className="flex flex-row gap-4">
            <Button className="mt-4 bg-zinc-900 text-zinc-400 hover:bg-zinc-800">
                <Link href="/upload" className="flex items-center">
                    Przejdź do przesyłania
                <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
        </Button>

        <Button className="mt-4 bg-zinc-900 text-zinc-400 hover:bg-zinc-800">
            <Link href="/search" className="flex items-center">
                Dostałem link
                <LinkIcon className="w-4 h-4 ml-2" />
            </Link>
        </Button>

        </section>
    </main>
  )
}