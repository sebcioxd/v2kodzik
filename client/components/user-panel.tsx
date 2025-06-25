"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Clock, ExternalLink, Loader2, Lock, Link as LinkIcon, CalendarArrowDown, CalendarArrowUp } from "lucide-react";
import { authClient, User } from "@/lib/auth-client";
import { useTransition } from "react";
import { useState } from "react";
import Link from "next/link";
type Share = {
    id: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    userId: string;
    code: string;
    private: boolean;
}

function formatDate(dateString: string) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data niedostępna';
    }
}

export default function UserPanel({ shares, user }: { shares: Share[], user: User }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isRouting, startTransition] = useTransition();

    return (
        <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-lg max-w-md animate-fade-in-01-text mt-10">
            <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
                    <h2 className="text-xl text-zinc-200 font-medium">Panel użytkownika <span className="text-zinc-400">{user.name}</span></h2>
                    <Button 
                        onClick={async () => {
                            setIsLoading(true);
                            await authClient.signOut({
                              fetchOptions: {
                                credentials: "include",
                                onSuccess: () => {
                                    setIsLoading(false);
                                    startTransition(() => {
                                        router.push("/auth");
                                    });
                                },
                              },
                            });
                          }}
                        variant="ghost" 
                        size="sm"
                        className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-dashed border-zinc-800"
                    >
                        
                        {isLoading || isRouting ? <><Loader2 className="h-4 w-4 animate-spin" /> Wylogowywanie...</> :  <><LogOut className="h-4 w-4 mr-2" /> Wyloguj się</>}
                    </Button>
                </div>

                <div className="border-b border-dashed border-zinc-800 pb-4">
                    <h3 className="text-sm text-zinc-400 flex items-center gap-2 mb-4">
                        <Clock className="h-4 w-4" />
                        Twoja historia udostępnień
                    </h3>
                    
                    <div className="space-y-3">
                        {shares.length === 0 && (
                            <div className="text-zinc-400 text-sm">
                                Brak udostępnień. <Link href="/upload" className="text-zinc-200 hover:text-zinc-200 hover:bg-zinc-800 rounded-md p-1">Dodaj nowe piki</Link>
                            </div>
                        )}
                        {shares?.map((share) => (
                            <div 
                                key={share.id}
                                className="border border-dashed border-zinc-800 rounded-md p-4 bg-zinc-950/10 hover:bg-zinc-950/20 transition-colors animate-slide-in-bottom"
                            >
                                <div className="flex justify-between items-center mb-2 border-b border-dashed border-zinc-700 pb-2">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-400 text-sm font-medium flex flex-row gap-2 items-center">
                                            <LinkIcon className="h-4 w-4" /> Kod:<span className="text-zinc-200 ml-[-2px]">{share.slug}</span> {share.private ? <Lock className="h-4 w-4 text-zinc-400" /> : null}
                                        </span>
                                    </div>
                                    <Link
                                        href={`/${share.slug}`}
                                        className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800  rounded-md flex flex-row gap-1 items-center justify-center"
                                    > 
                                    <span className="flex flex-row gap-1 p-1 items-center">
                                        <ExternalLink className="h-4 w-4" /> Odwiedź
                                    </span>
                                    </Link>
                                </div>
                                <div className="flex  flex-col justify-between gap-1  text-sm text-zinc-400">
                                    <span className="flex flex-row gap-1 items-center"><CalendarArrowUp className="h-4 w-4 text-zinc-200" /> Utworzono: {formatDate(share.createdAt)}</span>
                                    <span className="flex flex-row gap-1 items-center"><CalendarArrowDown className="h-4 w-4 text-zinc-200" /> Wygasa: {formatDate(share.expiresAt)}</span>
                                </div>
                                {share.private && (
                                <div className="flex flex-row gap-2 mt-2 ">
                                    <span className="text-zinc-300 text-sm mt-2">
                                        Plik prywatny. Szyfrowanie włączone.
                                    </span>
                                </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
