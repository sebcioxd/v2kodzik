import Link from "next/link";

export default function Footer() {
    return (
        <footer className="flex justify-center items-center my-20">
            <p className="text-zinc-700 text-xs">projekt - <Link href="https://niarde.xyz" className="text-zinc-500 hover:text-zinc-100">niarde.xyz</Link>. pwr by <Link href="https://kaczynskiweb.vercel.app/" className="text-zinc-500 hover:text-zinc-100">kaczynski company</Link></p>
        </footer>
    )
}
