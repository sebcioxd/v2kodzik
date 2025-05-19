"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";

function ForgetPasswordEmailSentSuccess() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="flex flex-col items-center justify-center container mx-auto max-w-xl mt-5">
      <div className="text-zinc-100 border border-dashed border-zinc-800 rounded-lg w-full max-w-2xl p-8 relative animate-fade-in-01-text opacity-0">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <CheckCircle className="w-4 h-4" />
            <span>Link do zmiany hasła wysłany</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl">
              Wysłaliśmy link do zmiany hasła
            </h2>
            <p className="text-zinc-500">
              Sprawdź swoją skrzynkę pocztową{" "}
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
                <li>2. Kliknij w link do zmiany hasła</li>
                <li>3. Zostaniesz przekierowany do strony gdzie możesz zmienić hasło</li>
                <li>4. Ustaw nowe hasło i zaloguj się ponownie.</li>
              </ul>

              <p className="text-sm text-zinc-500">
                Nie otrzymałeś emaila? Sprawdź folder spam
              </p>

              <Link
                href="/"
                className="w-full bg-zinc-900/20 border border-dashed border-zinc-800 backdrop-blur-sm hover:bg-zinc-800 text-zinc-400 rounded-md px-4 py-2 text-center transition-colors animate-slide-in-left"
              >
                Wróć do strony głównej
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgetPasswordEmailSentSuccessPage() {
  return (
    <Suspense fallback={<div className="text-zinc-500">Ładowanie...</div>}>
      <ForgetPasswordEmailSentSuccess />
    </Suspense>
  );
}