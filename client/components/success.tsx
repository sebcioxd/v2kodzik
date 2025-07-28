"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Share2, ArrowLeft, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export default function Success() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const time = searchParams.get("time");
  const type = searchParams.get("type");
  const [isSharing, setIsSharing] = useState(false);
  const fullUrl = type === "upload" ? `${process.env.NEXT_PUBLIC_SITE_URL}/${slug}` : `${process.env.NEXT_PUBLIC_SITE_URL}/s/${slug}`;

  // useEffect(() => {
  //   const end = Date.now() + 3 * 1000;
  //   const colors = ["#6366f1", "#8b5cf6", "#d946ef", "#ec4899", "#f43f5e"];

  //   const frame = () => {
  //     if (Date.now() > end) return;

  //     confetti({
  //       particleCount: 2,
  //       angle: 60,
  //       spread: 55,
  //       startVelocity: 60,
  //       origin: { x: 0, y: 0.5 },
  //       colors: colors,
  //     });
  //     confetti({
  //       particleCount: 2,
  //       angle: 120,
  //       spread: 55,
  //       startVelocity: 60,
  //       origin: { x: 1, y: 0.5 },
  //       colors: colors,
  //     });

  //     requestAnimationFrame(frame);
  //   };

  //   frame();
  // }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Link skopiowany do schowka!');
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error('Nie udało się skopiować linku');
    }
  };

  const shareLink = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Pliki wysłane',
          text: 'Sprawdź te pliki, które wysłałem',
          url: fullUrl,
        });
      } else {
        await copyToClipboard();
      }
    } catch (err) {
      console.error("Share failed:", err);
      toast.error('Nie udało się udostępnić linku');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-sm max-w-sm animate-fade-in-01-text mt-10">
      <div className="w-full space-y-4">
        <div className="flex flex-col items-center justify-center pb-2 animate-fade-in-01-text opacity-0">
          <h1 className="text-2xl font-semibold min-w-xl tracking-tight text-center text-zinc-100">
          Link <span className="text-zinc-400">{slug}</span> został wygenerowany!
          </h1>
          <p className="text-zinc-500 text-md tracking-tight">
          Twój link będzie aktywny przez następne {time === "24" ? "24 godziny" : time === "168" ? "7 dni" : "30 minut"}          </p>
        </div>


        <div className="w-full p-3 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-md animate-slide-in-bottom">
          <p className="text-zinc-400 text-sm mb-2 flex items-center gap-2 tracking-tight">
            <LinkIcon className="h-4 w-4" />
            Twój link: (kliknij aby przejść)
          </p>
          <div className="flex items-center gap-2">
            <span className="flex-1 p-1 bg-zinc-900/50 text-md font-medium rounded-md text-zinc-200 overflow-x-auto border border-zinc-800/50">
              <Link href={fullUrl} className="hover:text-zinc-100 transition-colors tracking-tight p-1">
                {fullUrl}
              </Link>
            </span>
            <Button
              onClick={copyToClipboard}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-dashed border-zinc-800"
              size="sm"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-4 w-full animate-slide-in-bottom">
          <Button
            onClick={shareLink}
            disabled={isSharing}
            size="sm"
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-dashed border-zinc-800"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Udostępnij
          </Button>
          <Button
            asChild
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-dashed border-zinc-800"
            size="sm"
          >
            <Link href="/upload">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wróć
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
