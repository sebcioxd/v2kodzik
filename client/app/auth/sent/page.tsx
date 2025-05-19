"use client";

import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle } from "lucide-react";
import { Suspense } from "react";

function SentContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    
    return (
        <div className="flex flex-col items-center justify-center container mx-auto  mt-5 max-w-xl">
            <div className="text-zinc-100 border border-dashed border-zinc-800 rounded-lg w-full max-w-2xl p-8 relative animate-fade-in-01-text opacity-0">
                <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Mail className="w-4 h-4" />
                        <span>Weryfikacja email</span>
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-2xl">
                            Sprawdź swoją skrzynkę odbiorczą
                        </h2>
                        <p className="text-zinc-500">
                            Wysłaliśmy link do weryfikacji na{" "}
                            <span className="text-zinc-200">{email}</span>
                        </p>
                    </div>

                    <div className="bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm rounded-lg p-6">
                        <div className="flex flex-col space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-zinc-900/50 border border-dashed border-zinc-800">
                                    <CheckCircle className="w-4 h-4 text-zinc-400" />
                                </div>
                                <h3 className="text-zinc-200">Kolejne kroki:</h3>
                            </div>

                            <ul className="text-zinc-500 space-y-2 text-sm">
                                <li>1. Otwórz email, który właśnie wysłaliśmy</li>
                                <li>2. Kliknij link do weryfikacji</li>
                                <li>3. Zostaniesz przekierowany do strony głównej</li>
                            </ul>

                            <div className="text-sm text-zinc-500">
                                Nie otrzymałeś emaila? Sprawdź folder spam lub{" "}
                                <button className="text-zinc-400 hover:text-zinc-300 transition-colors">
                                    kliknij tutaj aby wysłać ponownie
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Sent() {
    return (
        <Suspense fallback={<div className="text-zinc-500">Ładowanie...</div>}>
            <SentContent />
        </Suspense>
    );
}