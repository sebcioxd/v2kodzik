"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get("email");
    const [countdown, setCountdown] = useState(5);
    
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        if (countdown === 0) {
            clearInterval(timer);
            router.push('/auth');
        }

        return () => clearInterval(timer);
    }, [countdown, router]);

    return (
        <div className="flex flex-col items-center justify-center container mx-auto max-w-xl mt-10 px-4">
            <div className="w-full text-zinc-100 border border-dashed border-zinc-800 rounded-lg overflow-hidden">
                <div className="p-8 relative">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3 animate-fade-in-01-text opacity-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 rounded-full bg-zinc-900/20 backdrop-blur-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Email zweryfikowany</span>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-4 animate-slide-in-left opacity-0">
                        <h2 className="text-2xl font-medium tracking-tight">Witamy na pokładzie!</h2>
                        <p className="text-zinc-400">
                            Twój email <span className="text-zinc-200 font-medium">{email}</span> został pomyślnie zweryfikowany.
                        </p>
                    </div>

                    {/* Success Card */}
                    <div className="mt-8 bg-zinc-900/20 border border-zinc-800 rounded-lg p-6 animate-slide-in-bottom opacity-0">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-full bg-zinc-900/50 border border-zinc-800">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium text-zinc-200">Konto aktywowane</h3>
                                <p className="text-sm text-zinc-400">
                                    Twoje konto zostało pomyślnie aktywowane. Możesz się teraz zalogować i korzystać z serwisu.
                                </p>
                                <div className="pt-4 space-y-3">
                                    <a 
                                        href="/auth" 
                                        className="inline-flex items-center px-4 py-2 bg-zinc-900 text-zinc-400 rounded-md border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                                    >
                                        Przejdź do logowania
                                    </a>
                                    <p className="text-sm text-zinc-500">
                                        Automatyczne przekierowanie za {countdown} sekund...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Verify() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen text-zinc-400">
                Ładowanie...
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}