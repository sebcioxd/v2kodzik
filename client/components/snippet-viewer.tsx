"use client";

import { useState, useEffect } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, Clock, LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface SnippetViewerProps {
  code: string;
  language: string;
  slug: string;
  createdAt: string;
  expiresAt: string;
}

export default function SnippetViewer({ code, language, slug, createdAt, expiresAt }: SnippetViewerProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Reset copy button after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast.success('Kod skopiowany do schowka!');
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error('Nie udało się skopiować kodu');
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Shared Code Snippet',
          url: `https://www.dajkodzik.pl/s/${slug}`
        });
      } else {
        await navigator.clipboard.writeText(`https://www.dajkodzik.pl/s/${slug}`);
        toast.success('Link skopiowany do schowka!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Nie udało się udostępnić linku');
    } finally {
      setIsSharing(false);
    }
  };

  const formatTimeRemaining = (createdAt: string, expiresAt: string) => {
    if (!expiresAt) return "Czas nieznany";

    const expires = new Date(expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Wygaśnie w ciągu kilku godz.";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  // Map common language names to Prism-supported languages
  const getLanguageAlias = (lang: string): string => {
    const aliases: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'cs': 'csharp',
      'cpp': 'cpp',
      'jsx': 'jsx',
      'tsx': 'tsx',
    };
    return aliases[lang.toLowerCase()] || lang.toLowerCase();
  };

  return (
    <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-3xl max-w-xl animate-fade-in-01-text mt-10">
      <div className="w-full space-y-4">
        {/* Header Info */}
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="border-b border-dashed border-zinc-800 p-3 bg-zinc-950/10 text-zinc-400 text-sm flex items-center justify-between">
            <span>Kod linku: <span className="font-medium text-zinc-200">{slug}</span></span>
            <LinkIcon className="h-4 w-4" />
          </div>
        </div>

        {/* Expiration Time */}
        <div className="border border-dashed border-zinc-800 rounded-md p-3 bg-zinc-950/10 text-zinc-400 text-sm flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Link wygaśnie za:
          </span>
          <span className="font-medium text-zinc-200">{formatTimeRemaining(createdAt, expiresAt)}</span>
        </div>

        {/* Code Block */}
        <div className="relative rounded-lg overflow-hidden border border-dashed border-zinc-800 bg-zinc-950/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Language Badge */}
          <div className="absolute top-3 right-3 px-2 py-1 text-xs rounded-md bg-zinc-800/50 text-zinc-400 border border-dashed border-zinc-700 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-zinc-400" />
            {language}
          </div>

          {/* Actions */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-dashed border-zinc-700 transition-colors duration-200"
              onClick={handleCopy}
            >
              {isCopied ? (
                <Check className="h-4 w-4 animate-in zoom-in duration-200" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-dashed border-zinc-700 transition-colors duration-200"
              onClick={handleShare}
              disabled={isSharing}
            >
              {isSharing ? (
                <div className="animate-spin">
                  <Share2 className="h-4 w-4" />
                </div>
              ) : (
                <Share2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Code Content */}
          <div className="pt-16 pb-4 px-4 h-[800px] overflow-x-auto">
            <Highlight
              theme={{
                ...themes.nightOwl,
                plain: {
                  color: "#D4D4D8",
                  backgroundColor: "transparent",
                },
              }}
              code={code.trim()}
              language={getLanguageAlias(language)}
            >
              {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre 
                  className={`${className} text-sm font-mono`} 
                  style={{ ...style, background: 'transparent' }}
                >
                  {tokens.map((line, i) => (
                    <div 
                      key={i} 
                      {...getLineProps({ line })} 
                      className="table-row hover:bg-zinc-800/20 transition-colors duration-150"
                    >
                      <span className="table-cell text-right pr-4 text-zinc-600 select-none w-12 text-xs">
                        {i + 1}
                      </span>
                      <span className="table-cell whitespace-pre">
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </span>
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </div>
        </div>
      </div>
    </main>
  );
}