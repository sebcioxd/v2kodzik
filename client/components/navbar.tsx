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
        <nav className="flex flex-col p-2 rounded-md mx-auto w-full md:max-w-4xl sticky top-0 z-50 max-w-sm border-zinc-800 pt-2  backdrop-blur-sm animate-fade-in-01-text">
            <div className="flex justify-between items-center w-full">
                <Link href="/" className="flex items-center gap-2 group">
                    <h1 className="text-zinc-400 md:text-lg text-xl group-hover:text-zinc-200 transition-colors">dajkodzik.pl</h1>
                </Link>
                
                <button 
                    className="md:hidden text-zinc-400 hover:text-zinc-200 transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className="hidden md:flex items-center gap-6">
                    <Link 
                        href="/upload" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 relative ${
                            pathname === "/upload" 
                                ? "text-zinc-200 after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-zinc-400 after:rounded-full after:animate-fade-in-01-text" 
                                : "text-zinc-400 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[1px] hover:after:bg-zinc-600 hover:after:rounded-full"
                        }`}
                    >
                        Prześlij pliki
                    </Link>
                    <Link 
                        href="/search" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 relative ${
                            pathname === "/search" 
                                ? "text-zinc-200 after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-zinc-400 after:rounded-full after:animate-fade-in-01-text" 
                                : "text-zinc-400 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[1px] hover:after:bg-zinc-600 hover:after:rounded-full"
                        }`}
                    >
                        Mam kod
                    </Link>
                    <Link 
                        href="/faq" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 relative ${
                            pathname === "/faq" 
                                ? "text-zinc-200 after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-zinc-400 after:rounded-full after:animate-fade-in-01-text" 
                                : "text-zinc-400 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[1px] hover:after:bg-zinc-600 hover:after:rounded-full"
                        }`}
                    >
                        FAQ
                    </Link>
                    <Link 
                        href="/schowek" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 relative ${
                            pathname === "/schowek" 
                                ? "text-zinc-200 after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-zinc-400 after:rounded-full after:animate-fade-in-01-text" 
                                : "text-zinc-400 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[1px] hover:after:bg-zinc-600 hover:after:rounded-full"
                        }`}
                    >
                        Schowek
                    </Link>
                    {isPending ? (
                        <div className="h-5 w-14 bg-zinc-800 animate-pulse rounded-full" />
                    ) : session ? (
                        <Link 
                            href="/panel" 
                            className={`text-sm font-medium transition-colors hover:text-zinc-200 relative ${
                                pathname === "/panel" 
                                    ? "text-zinc-200 after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-zinc-400 after:rounded-full after:animate-fade-in-01-text" 
                                    : "text-zinc-400 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[1px] hover:after:bg-zinc-600 hover:after:rounded-full"
                            }`}
                        >
                            Panel
                        </Link>
                    ) : (
                        <Link 
                            href="/auth" 
                            className={`text-sm font-medium transition-colors hover:text-zinc-200 relative ${
                                pathname === "/auth" 
                                    ? "text-zinc-200 after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-zinc-400 after:rounded-full after:animate-fade-in-01-text" 
                                    : "text-zinc-400 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[1px] hover:after:bg-zinc-600 hover:after:rounded-full"
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
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 relative ${
                            pathname === "/upload" 
                                ? "text-zinc-200 after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-zinc-400 after:rounded-full after:animate-fade-in-01-text" 
                                : "text-zinc-400 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[1px] hover:after:bg-zinc-600 hover:after:rounded-full"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Prześlij plik
                    </Link>
                    <Link 
                        href="/schowek" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 relative ${
                            pathname === "/schowek" 
                                ? "text-zinc-200 after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-zinc-400 after:rounded-full after:animate-fade-in-01-text" 
                                : "text-zinc-400 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[1px] hover:after:bg-zinc-600 hover:after:rounded-full"
                        }`}
                    >
                        Schowek
                    </Link>
                    <Link 
                        href="/search" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 relative ${
                            pathname === "/search" 
                                ? "text-zinc-200 after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-zinc-400 after:rounded-full after:animate-fade-in-01-text" 
                                : "text-zinc-400 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[1px] hover:after:bg-zinc-600 hover:after:rounded-full"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Mam kod
                    </Link>
                    <Link 
                        href="/faq" 
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 relative ${
                            pathname === "/faq" 
                                ? "text-zinc-200 after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[1px] after:bg-zinc-400 after:rounded-full after:animate-fade-in-01-text" 
                                : "text-zinc-400 hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[1px] hover:after:bg-zinc-600 hover:after:rounded-full"
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
                        className={`text-sm font-medium transition-colors hover:text-zinc-200 relative ${
                            pathname === "/panel" ? "text-zinc-200" : "text-zinc-400"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Panel
                        </Link>
                    ) : (
                        <Link 
                            href="/auth" 
                            className={`text-sm font-medium transition-colors hover:text-zinc-200 ${
                                pathname === "/auth" ? "text-zinc-200" : "text-zinc-400"
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
