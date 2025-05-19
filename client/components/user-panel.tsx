"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Clock, ExternalLink } from "lucide-react";
import { authClient, User } from "@/lib/auth-client";

type History = {
    id: string;
    shareId: string;
    fileName: string;
    size: number;
    storagePath: string;
    createdAt: string;
    updatedAt: string;
}

type HistoryResponse = {
    uploaded_files: History;
    shares: {
        id: string;
        slug: string;
        createdAt: string;
        updatedAt: string;
        expiresAt: string;
        userId: string;
    };
}

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTimeRemaining(expiresAt: string) {
    const expires = new Date(expiresAt);
    const now = new Date();
    if (expires < now) return "Wygasło";
    
    const diff = expires.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
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

export default function UserPanel({ history, user }: { history: HistoryResponse[], user: User }) {
    const router = useRouter();

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                credentials: "include",
            onSuccess: () => {
                    router.push("/auth");
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
                        <LogOut className="h-4 w-4 mr-2" />
                        Wyloguj
                    </Button>
                </div>

                <div className="border-b border-dashed border-zinc-800 pb-4">
                    <h3 className="text-sm text-zinc-400 flex items-center gap-2 mb-4">
                        <Clock className="h-4 w-4" />
                        Historia przesłanych plików
                    </h3>
                    
                    <div className="space-y-3">
                        {history?.map((item) => (
                            <div 
                                key={item.uploaded_files.id}
                                className="border border-dashed border-zinc-800 rounded-md p-4 bg-zinc-950/10 hover:bg-zinc-950/20 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-200 text-sm font-medium">
                                            {item.uploaded_files.fileName}
                                        </span>
                                        <span className="text-zinc-500 text-xs">
                                            {formatBytes(Number(item.uploaded_files.size) || 0)}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                                        onClick={() => router.push(`/${item.shares.slug}`)}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex justify-between items-center text-xs text-zinc-400">
                                    <span>Utworzono: {formatDate(item.uploaded_files.createdAt)}</span>
                                    <span>Wygasa: {formatDate(item.shares.expiresAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
