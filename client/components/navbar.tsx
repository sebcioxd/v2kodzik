"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="flex flex-col p-2 rounded-md mx-auto w-full md:max-w-xl max-w-sm border border-dashed border-zinc-800 mt-2">
            <div className="flex justify-between items-center w-full">
                <Link href="/" className="flex items-center gap-2">
                    
                    <h1 className="text-zinc-400 md:text-lg text-sm font-bold font-mono">.kodzik</h1>
                </Link>
                
                <button 
                    className="md:hidden text-zinc-400 hover:text-zinc-100"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <div className="hidden md:flex items-center gap-4">
                    <Link href="/upload" className={`text-sm font-medium hover:text-zinc-100 ${pathname === "/upload" ? "text-zinc-100" : "text-zinc-400"}`}>Prześlij plik</Link>
                    <Link href="/search" className={`text-sm font-medium hover:text-zinc-100 ${pathname === "/search" ? "text-zinc-100" : "text-zinc-400"}`}>Mam kod</Link>
                    <Link href="/faq" className={`text-sm font-medium hover:text-zinc-100 ${pathname === "/faq" ? "text-zinc-100" : "text-zinc-400"}`}>FAQ</Link>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden flex flex-col gap-4 mt-4 border-t border-zinc-800 pt-4">
                    <Link 
                        href="/upload" 
                        className={`text-sm font-medium hover:text-zinc-100 ${pathname === "/upload" ? "text-zinc-100" : "text-zinc-400"}`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Prześlij plik
                    </Link>
                    <Link 
                        href="/search" 
                        className={`text-sm font-medium hover:text-zinc-100 ${pathname === "/search" ? "text-zinc-100" : "text-zinc-400"}`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Mam kod
                    </Link>
                    <Link 
                        href="/faq" 
                        className={`text-sm font-medium hover:text-zinc-100 ${pathname === "/faq" ? "text-zinc-100" : "text-zinc-400"}`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        FAQ
                    </Link>
                </div>
            )}
        </nav>
    )
}
