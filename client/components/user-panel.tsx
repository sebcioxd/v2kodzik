"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Clock, ExternalLink, Loader2, Lock, Link as LinkIcon, CalendarArrowDown, CalendarArrowUp, KeyRound } from "lucide-react";
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
    const [isLogoutLoading, setIsLogoutLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [isRouting, startTransition] = useTransition();

    return (
        <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-5xl max-w-md animate-fade-in-01-text mt-10">
            <div className="w-full space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h2 className="text-xl text-zinc-200 font-medium">
                        Panel użytkownika <span className="text-zinc-400">{user.name}</span>
                    </h2>
                    
                    <div className="flex flex-row gap-3 items-center">
                        <Button 
                            onClick={async () => {
                                setIsLogoutLoading(true);
                                await authClient.signOut({
                                    fetchOptions: {
                                        credentials: "include",
                                        onSuccess: () => {
                                            setIsLogoutLoading(false);
                                            startTransition(() => {
                                                router.push("/auth");
                                            });
                                        },
                                    },
                                });
                            }}
                            variant="ghost" 
                            size="sm"
                            className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-dashed border-zinc-800 px-4"
                        >
                            {isLogoutLoading || isRouting ? 
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Wylogowywanie...</> : 
                                <><LogOut className="h-4 w-4 mr-2" /> Wyloguj się</>
                            }
                        </Button>
                        
                        {user.oauth && (
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-dashed border-zinc-800 px-4"
                            >
                                <Link href="/oauth-password">
                                    {isPasswordLoading ? 
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Przekierowywanie...</> :
                                        <><KeyRound className="h-4 w-4 mr-2" /> Ustaw hasło</>
                                    }
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="border-b border-zinc-800 pb-6">
                    <h3 className="text-sm text-zinc-400 flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4" />
                        Twoja historia udostępnień
                    </h3>
                    
                    <span className="text-zinc-600 text-sm block mb-4">
                        Historia schowka jak narazie nie jest dostępna.
                    </span>
                    
                    <div className="space-y-4">
                        {shares.length === 0 && (
                            <div className="text-zinc-400 text-sm ">
                                Brak udostępnień. {" "}
                                <Link 
                                    href="/upload" 
                                    className="text-zinc-200 hover:bg-zinc-800 rounded-md px-2 py-1 transition-colors inline-flex items-center gap-1"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Dodaj nowe pliki
                                </Link>
                            </div>
                        )}
                        
                        {shares?.map((share) => (
                            <div 
                                key={share.id}
                                className="bg-zinc-900/30 border border-zinc-900 rounded-md p-4 hover:bg-zinc-900/20 transition-colors animate-slide-in-bottom"
                            >
                                <div className="flex justify-between items-center mb-2 border-b border-zinc-900 pb-2">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-400 text-sm font-medium flex flex-row gap-2 items-center">
                                            <LinkIcon className="h-4 w-4" /> 
                                            Kod linku: <span className="text-zinc-200">{share.slug}</span> 
                                            {share.private && <Lock className="h-4 w-4 text-zinc-400" />}
                                        </span>
                                    </div>
                                    <Link
                                        href={`/${share.slug}`}
                                        className="text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-900/80 rounded-md px-3 py-1 flex items-center gap-2 transition-colors"
                                    > 
                                        <ExternalLink className="h-4 w-4" /> 
                                        Odwiedź
                                    </Link>
                                </div>
                                <div className="flex flex-col gap-2 text-sm text-zinc-400 pt-2">
                                    <span className="flex items-center gap-2">
                                        <CalendarArrowUp className="h-4 w-4 text-zinc-200" /> 
                                        Utworzono: {formatDate(share.createdAt)}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <CalendarArrowDown className="h-4 w-4 text-zinc-200" /> 
                                        Wygasa: {formatDate(share.expiresAt)}
                                    </span>
                                </div>
                                
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
