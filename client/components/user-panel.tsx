"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Clock, ExternalLink, Loader2 } from "lucide-react";
import { authClient, User } from "@/lib/auth-client";
import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
type Share = {
    id: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    userId: string;
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

    const { refetch } = useSession();

    const handleLogout = async () => {
        setIsLoading(true);
        await authClient.signOut({
            fetchOptions: {
                credentials: "include",
            onSuccess: () => {
                    refetch();
                    router.push("/auth");
                    setIsLoading(false);
                },
            
            },
        });
    };

    return (
        <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-lg max-w-md animate-fade-in-01-text mt-10">
            <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
                    <h2 className="text-xl text-zinc-200 font-medium">Panel użytkownika {user.name}</h2>
                    <Button 
                        onClick={handleLogout}
                        variant="ghost" 
                        size="sm"
                        className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-dashed border-zinc-800"
                    >
                        
                        {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Wylogowywanie...</> :  <><LogOut className="h-4 w-4 mr-2" /> Wyloguj</>}
                    </Button>
                </div>

                <div className="border-b border-dashed border-zinc-800 pb-4">
                    <h3 className="text-sm text-zinc-400 flex items-center gap-2 mb-4">
                        <Clock className="h-4 w-4" />
                        Historia udostępnień
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
                                className="border border-dashed border-zinc-800 rounded-md p-4 bg-zinc-950/10 hover:bg-zinc-950/20 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-200 text-sm font-medium">
                                            Kod: {share.slug}
                                        </span>
                                    </div>
                                    <Link
                                        href={`/${share.slug}`}
                                        className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 p-2 rounded-md flex flex-row gap-1 items-center justify-center"
                                    > 
                                        <ExternalLink className="h-4 w-4" /> 
                                    </Link>
                                </div>
                                <div className="flex justify-between items-center text-xs text-zinc-400">
                                    <span>Utworzono: {formatDate(share.createdAt)}</span>
                                    <span>Wygasa: {formatDate(share.expiresAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
