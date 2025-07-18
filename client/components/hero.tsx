"use client"
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Link as LinkIcon, History, AlertCircle, Upload, Download } from "lucide-react";
import { RecentShares } from "./link-comp";
import { useSession } from "@/lib/auth-client";

export default function Hero() {
  const { data: session, isPending } = useSession();

  return (
    <main className="flex flex-col items-center justify-center md:max-w-4xl max-w-sm  mx-auto px-4">
      {/* Hero Section with Gradient Background */}
      <div className="w-full rounded-2xl bg-gradient-to-b from-zinc-900/50 to-zinc-950/50 p-8 backdrop-blur-sm border border-dashed border-zinc-800 animate-fade-in-01-text">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo with Glow Effect */}
          <div className="relative">
            <Image 
              src="/logo-no-bg.png" 
              alt="Hero" 
              width={220} 
              height={220} 
              className=" animate-fade-in-01-image opacity-0"
            />
            <div className="absolute inset-0 bg-zinc-400/10 blur-2xl rounded-full animate-pulse" />
          </div>

          {/* Main Heading with Gradient Text */}
          <div className="text-center space-y-4">
            <h1 className="md:text-4xl text-3xl font-bold tracking-tighter animate-fade-in-01-text opacity-0 bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Przesyłaj pliki w mgnieniu oka
            </h1>
            <p className="text-zinc-400 text-lg tracking-tight text-wrap max-w-2xl text-center animate-slide-in-left opacity-0 leading-relaxed">
              Dzięki wygodnemu interfejsowi, przesyłanie plików jest niezwykle proste. 
              Użyj naszego serwisu do przesyłania plików i zyskaj wiele czasu. 
              Możesz w łatwy sposób generować linki niestandardowe, skracając czas drugiej osoby.
            </p>
          </div>

          {/* CTA Buttons with Enhanced Styling */}
          <section className="flex flex-col md:flex-row gap-4 w-full max-w-md">
            <Link href="/upload" className="flex-1">
              <Button className="w-full bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-all duration-300 animate-slide-in-bottom border border-dashed border-zinc-800 group">
                <Upload className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
                Przejdź do przesyłania
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/search" className="flex-1">
              <Button className="w-full bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-all duration-300 animate-slide-in-bottom border border-dashed border-zinc-800 group">
                <Download className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
                Dostałem link
                <LinkIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </section>
          
          {/* File Size Limit Notice */}
          <div className="w-full max-w-md p-1 rounded-lganimate-slide-in-bottom">
            <div className="flex items-center gap-2 justify-center">
              <AlertCircle className="w-4 h-4 text-zinc-400" />
              <p className="text-zinc-400 text-sm">
                Maksymalny rozmiar plików: <span className="text-zinc-300">100MB</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Prompt with Enhanced Design */}
      {!session && !isPending && (
        <div className="w-full mt-8 p-4 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 animate-slide-in-bottom">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-zinc-400" />
              <p className="text-zinc-400 text-md">
                Zaloguj się, aby zobaczyć historię przesyłanych plików
              </p>
            </div>
            <Link 
              href="/auth" 
              className="text-zinc-300 hover:text-zinc-100 transition-colors underline underline-offset-4 hover:underline-offset-2"
            >
              Zaloguj
            </Link>
          </div>
        </div>
      )}

      {/* Recent Shares Section with Enhanced Design */}
      <div className="w-full mt-8 space-y-2 animate-slide-in-bottom">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-zinc-400" />
          <h2 className="text-zinc-300 font-medium">Ostatnio wygenerowane linki</h2>
        </div>
        
          <RecentShares />
        
      </div>
    </main>
  )
}