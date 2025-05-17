"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Share2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function Success() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const [copied, setCopied] = useState(false);
  const fullUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/${slug}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pliki wysłane',
          text: 'Sprawdź te pliki, które wysłałem',
          url: fullUrl,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <main className="flex flex-col items-center justify-center w-full mx-auto space-y-6 animate-fade-in-01-text mt-6 container  md:max-w-nd max-w-sm">
      <Alert className="bg-zinc-950/10 border-zinc-800 border-dashed">
       
        <AlertTitle className="text-zinc-200">Link został wygenerowany!</AlertTitle>
        <AlertDescription className="text-zinc-400">
          Twój link będzie aktywny przez następne 24 godziny.
        </AlertDescription>
      </Alert>

      <div className="w-full p-4 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-md">
        <p className="text-zinc-400 text-sm mb-2">Twój link:</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 p-2 bg-zinc-900/50  rounded text-blue-400 text-sm overflow-x-auto">
            <Link href={fullUrl}>{fullUrl}</Link>
          </code>
          <Button
            onClick={copyToClipboard}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
            size="sm"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 w-full">
        <Button
          onClick={shareLink}
          className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Udostępnij
        </Button>
        <Button
          asChild
          className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
        >
          <Link href="/upload">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Wróć
          </Link>
        </Button>
      </div>

      {copied && (
        <div className="p-2 border border-dashed border-green-800 text-green-300 text-center rounded-md text-sm w-full">
          Skopiowano do schowka!
        </div>
      )}
    </main>
  );
}
