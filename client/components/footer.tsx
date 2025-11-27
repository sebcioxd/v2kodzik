import CheckStatus from "./check-status";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="flex flex-col justify-center items-center my-20 animate-slide-in-bottom">
            <CheckStatus />
            <p className="text-zinc-700 text-sm">wykonanie - <Link href="https://niarde.xyz" className="text-zinc-500 hover:text-zinc-100">niarde.xyz</Link>. pwr by <Link href="https://kaczynskiweb.vercel.app/" className="text-zinc-500 hover:text-zinc-100">kaczynski company</Link></p>
            <p className="text-zinc-700 text-sm">
                <Link href="/terms" className="text-zinc-500 hover:text-zinc-100 mr-2">regulamin</Link>
                <Link href="https://github.com/sebcioxd/v2kodzik" className="text-zinc-500 hover:text-zinc-100">kod źródłowy</Link>
            </p>
           
        </footer>
    )
}
