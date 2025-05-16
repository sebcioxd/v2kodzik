"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const pathname = usePathname();
    return (
        <nav className="flex justify-between items-center p-2 rounded-md mx-auto w-full md:max-w-xl max-w-sm border border-dashed border-zinc-800  mt-2">
            <Link href="/" className="flex items-center gap-2">
                <h2 className="text-zinc-100 font-bold font-mono text-lg">.kodzik</h2>
            </Link>
            <div className="flex items-center gap-4">
                <Link href="/upload" className={`text-sm font-medium hover:text-zinc-100 ${pathname === "/upload" ? "text-zinc-100" : "text-zinc-400"}`}>Prześlij plik</Link>
                <Link href="/search" className={`text-sm font-medium hover:text-zinc-100 ${pathname === "/search" ? "text-zinc-100" : "text-zinc-400"}`}>Mam kod</Link>
                <Link href="/faq" className={`text-sm font-medium hover:text-zinc-100 ${pathname === "/faq" ? "text-zinc-100" : "text-zinc-400"}`}>FAQ</Link>
            </div>
        </nav>
    )
}
