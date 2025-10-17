"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function Navbar() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: session, isPending } = useSession();


    return (
        <nav className="flex flex-col p-2 rounded-md w-full border-b border-dashed sticky top-0 z-50  border-zinc-800 pt-2  backdrop-blur-md animate-fade-in-01-text">
            <div className="flex justify-between items-center w-full mx-auto md:max-w-4xl">
                <Link href="/" className="flex items-center gap-2 group">
                    <h1 className="text-zinc-200 md:text-xl text-lg tracking-tight group-hover:text-zinc-200 transition-colors">dajkodzik</h1>
                </Link>
                
                <button 
                    className="md:hidden text-zinc-400 hover:text-zinc-200 transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className="hidden md:flex items-center gap-2 tracking-tight">
                    <Link 
                        href="/upload" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md px-2 py-1 relative ${
                            pathname === "/upload" 
                                ? "text-zinc-200 bg-zinc-800/50" 
                                : "text-zinc-400"
                        }`}
                    >
                        Prześlij pliki
                    </Link>
                    <Link 
                        href="/schowek" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md px-2 py-1 relative ${
                            pathname === "/schowek" 
                                ? "text-zinc-200 bg-zinc-800/50" 
                                : "text-zinc-400"
                        }`}
                    >
                        Schowek
                    </Link>
                    <Link 
                        href="/search" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md px-2 py-1 relative ${
                            pathname === "/search" 
                                ? "text-zinc-200 bg-zinc-800/50" 
                                : "text-zinc-400"
                        }`}
                    >
                        Mam kod
                    </Link>
                    <Link 
                        href="/pricing" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md px-2 py-1 relative ${
                            pathname === "/pricing" 
                                ? "text-zinc-200 bg-zinc-800/50" 
                                : "text-zinc-400"
                        }`}
                    >
                        Cennik
                    </Link>
                    <Link 
                        href="/faq" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md px-2 py-1 relative ${
                            pathname === "/faq" 
                                ? "text-zinc-200 bg-zinc-800/50" 
                                : "text-zinc-400"
                        }`}
                    >
                        FAQ
                    </Link>
                    
                    {isPending ? (
                        <div className="h-5 w-14 bg-zinc-800 animate-pulse rounded-full" />
                    ) : session ? (
                        <Link 
                            href="/panel" 
                            className={`text-sm font-medium transition-colors hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md px-2 py-1 relative ${
                                pathname === "/panel" || pathname === "/panel/history" || pathname === "/panel/s-history" || pathname === "/panel/settings" || pathname === "/panel/integrations" || pathname === "/panel/subscription" || pathname === "/panel/limits"
                                    ? "text-zinc-200 bg-zinc-800/50" 
                                    : "text-zinc-400"
                            }`}
                        >
                            Panel
                        </Link>
                    ) : (
                        <Link 
                            href="/auth" 
                            className={`text-sm font-medium transition-colors hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md px-2 py-1 relative ${
                                pathname === "/auth" 
                                    ? "text-zinc-200 bg-zinc-800/50" 
                                    : "text-zinc-400"
                            }`}
                        >
                            Zaloguj
                        </Link>
                    )}
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden flex flex-col gap-4 mt-4 border-t border-zinc-800 pt-4 animate-fade-in-01-text">
                    <Link 
                        href="/upload" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md px-2 py-1 relative ${
                            pathname === "/upload" 
                                ? "text-zinc-200 bg-zinc-800/50" 
                                : "text-zinc-400"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Prześlij plik
                    </Link>
                    <Link 
                        href="/schowek" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md px-2 py-1 relative ${
                            pathname === "/schowek" 
                                ? "text-zinc-200 bg-zinc-800/50" 
                                : "text-zinc-400"
                        }`}
                    >
                        Schowek
                    </Link>
                    <Link 
                        href="/search" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md px-2 py-1 relative ${
                            pathname === "/search" 
                                ? "text-zinc-200 bg-zinc-800/50" 
                                : "text-zinc-400"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Mam kod
                    </Link>
                    <Link 
                        href="/pricing" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md px-2 py-1 relative ${
                            pathname === "/pricing" 
                                ? "text-zinc-200 bg-zinc-800/50" 
                                : "text-zinc-400"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Cennik
                    </Link>
                    <Link 
                        href="/faq" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md px-2 py-1 relative ${
                            pathname === "/faq" 
                                ? "text-zinc-200 bg-zinc-800/50 " 
                                : "text-zinc-400"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        FAQ
                    </Link>
                    {isPending ? (
                        <div className="h-5 w-14 bg-zinc-800 animate-pulse rounded-full" />
                    ) : session ? (
                        <Link 
                            href="/panel" 
                            className={`text-sm font-medium transition-colors hover:text-zinc-200 hover:bg-zinc-800/50 rounded-md px-2 py-1 relative ${
                                pathname === "/panel" || pathname === "/panel/history" || pathname === "/panel/s-history" || pathname === "/panel/settings" || pathname === "/panel/integrations"
                                    ? "text-zinc-200 bg-zinc-800/50" 
                                    : "text-zinc-400"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Panel
                        </Link>
                    ) : (
                        <Link 
                            href="/auth" 
                            className={`text-sm font-medium transition-colors hover:text-zinc-200 ${
                                pathname === "/auth" ? "text-zinc-200 bg-zinc-800/50" : "text-zinc-400"
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Zaloguj
                        </Link>
                    )}
                </div>
            )}
        </nav>
    )
}
