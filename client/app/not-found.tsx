import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center my-10">
            <h1 className="text-3xl text-zinc-400 tracking-tight mb-4 animate-fade-in-01-text">nie znaleziono szukanej strony</h1>
            <Link href="/" className="text-zinc-400 hover:text-zinc-100 animate-slide-in-left">Wróć do strony głównej</Link>  
        </div>
    )
}
