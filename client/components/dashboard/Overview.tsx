"use client";

import { Button } from "@/components/ui/button";
import { 
  Clock, 
  ExternalLink, 
  Lock, 
  Link as LinkIcon, 
  CalendarArrowDown, 
  CalendarArrowUp,
  FileText,
  Clipboard,
  ArrowRight,
  Sparkles,
  Target,
  History,
  Server,
  Settings,
  CreditCard,
  BarChart3,
  Search,
} from "lucide-react";
import { User } from "@/lib/auth-client";
import Link from "next/link";
import { formatDate } from "@/lib/date";

type Share = {
    id: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    userId: string;
    code: string;
    private: boolean;
}

export default function Overview({ user }: { user: User }) {
    return (
        <main className="">
            <div className="w-full space-y-8">
                {/* Welcome Header */}
                <div className="bg-gradient-to-b  backdrop-blur-sm border border-dashed border-zinc-800 rounded-lg p-8 animate-fade-in-01-text">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-zinc-800/50 rounded-full">
                            <Sparkles className="h-5 w-5 text-zinc-300" />
                        </div>
                        <h1 className="text-xl text-zinc-200 font-normal tracking-tight flex items-center gap-2">
                            Witamy w nowym panelu! <span className="text-zinc-400 text-sm font-normal bg-zinc-800/50 rounded-md px-2 py-0 ml-1">BETA</span>
                        </h1>
                    </div>
                    <p className="text-zinc-400 text-md leading-relaxed mb-6">
                        Cześć <span className="text-zinc-300 font-medium">{user.name}</span>! 
                        Przenieśliśmy się do nowego, ulepszonego panelu użytkownika. 
                        Tutaj znajdziesz wszystkie swoje pliki i schowki w jednym miejscu.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <Target className="h-4 w-4" />
                        <span>Panel został zaprojektowany z myślą o wygodzie użytkownika</span>
                    </div>
                </div>

                {/* Quick Navigation Cards */}
                <div className="space-y-6">
                    <h2 className="text-md text-zinc-200 font-medium tracking-tight flex items-center gap-2">
                        <History className="h-5 w-5 text-zinc-400" />
                        Szybka nawigacja
                    </h2>
                    
                    <div className="grid md:grid-cols-3 gap-4 h-full">
                        {/* File History Card */}
                        <Link href="/panel/history">
                            <div className="group bg-zinc-900/30 border border-dashed h-full border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/30 transition-all duration-300 animate-slide-in-left">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-zinc-800/50 rounded-lg group-hover:bg-zinc-700/50 transition-colors">
                                        <FileText className="h-6 w-6 text-zinc-300" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
                                </div>
                                <h3 className="text-zinc-200 font-medium mb-2 tracking-tight">
                                    Historia plików
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Przejrzyj wszystkie przesłane pliki, sprawdź ich status i zarządzaj linkami.
                                </p>
                            </div>
                        </Link>

                        {/* Clipboard History Card */}
                        <Link href="/panel/s-history">
                            <div className="group bg-zinc-900/30 border border-dashed h-full border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/30 transition-all duration-300 animate-slide-in-left">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-zinc-800/50 rounded-lg group-hover:bg-zinc-700/50 transition-colors">
                                        <Clipboard className="h-6 w-6 text-zinc-300" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
                                </div>
                                <h3 className="text-zinc-200 font-medium mb-2 tracking-tight flex items-center">
                                    Historia schowka <span className="text-zinc-400 text-sm font-normal bg-zinc-800/50 rounded-md px-2 py-0 ml-2">Nowość</span>
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Dostęp do wszystkich zapisanych fragmentów kodu i tekstów w schowku.
                                </p>
                            </div>
                        </Link>

                        <Link href="/panel/integrations">
                            <div className="group bg-zinc-900/30 border border-dashed h-full border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/30 transition-all duration-300 animate-slide-in-left">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-zinc-800/50 rounded-lg group-hover:bg-zinc-700/50 transition-colors">
                                        <Server className="h-6 w-6 text-zinc-300" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
                                </div>
                                <h3 className="text-zinc-200 font-medium mb-2 tracking-tight flex items-center">
                                    Integracje <span className="text-zinc-400 text-sm font-normal bg-zinc-800/50 rounded-md px-2 py-0 ml-2">Nowość</span>
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Zarządzaj i łącz swoje konta społecznościowe. Dostępne są Google i Discord.
                                </p>
                            </div>
                        </Link>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 h-full">
                        {/* File History Card */}
                        <Link href="/panel/subscription">
                            <div className="group bg-zinc-900/30 border border-dashed h-full border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/30 transition-all duration-300 animate-slide-in-left">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-zinc-800/50 rounded-lg group-hover:bg-zinc-700/50 transition-colors">
                                        <CreditCard className="h-6 w-6 text-zinc-300" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
                                </div>
                                <h3 className="text-zinc-200 font-medium mb-2 tracking-tight">
                                    Subskrypcje
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Zarządzaj swoimi subskrypcjami i planami.
                                </p>
                            </div>
                        </Link>

                        {/* Clipboard History Card */}
                        <Link href="/panel/limits">
                            <div className="group bg-zinc-900/30 border border-dashed h-full border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/30 transition-all duration-300 animate-slide-in-left">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-zinc-800/50 rounded-lg group-hover:bg-zinc-700/50 transition-colors">
                                        <BarChart3 className="h-6 w-6 text-zinc-300" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
                                </div>
                                <h3 className="text-zinc-200 font-medium mb-2 tracking-tight flex items-center">
                                    Twój transfer
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Zobacz i zarządzaj swoim miesięcznym transferem.
                                </p>
                            </div>
                        </Link>

                        <Link href="/panel/settings">
                            <div className="group bg-zinc-900/30 border border-dashed h-full border-zinc-800 rounded-lg p-4 hover:bg-zinc-800/30 transition-all duration-300 animate-slide-in-left">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-zinc-800/50 rounded-lg group-hover:bg-zinc-700/50 transition-colors">
                                        <Settings className="h-6 w-6 text-zinc-300" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all" />
                                </div>
                                <h3 className="text-zinc-200 font-medium mb-2 tracking-tight flex items-center">
                                    Ustawienia
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Zarządzaj swoimi ustawieniami i profilem. 
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <h2 className="text-md text-zinc-200 font-medium tracking-tight flex items-center gap-2">
                        <Target className="h-5 w-5 text-zinc-400" />
                        Szybkie akcje
                    </h2>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/upload" className="flex-1">
                            <Button size="sm" className="w-full bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-all duration-300 border border-dashed border-zinc-800 group">
                                <ExternalLink className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
                                Prześlij nowe pliki
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        
                        <Link href="/schowek" className="flex-1">
                            <Button size="sm" className="w-full bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-all duration-300 border border-dashed border-zinc-800 group">
                                <Clipboard className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
                                Dodaj do schowka
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>

                        <Link href="/search" className="flex-1">
                            <Button size="sm" className="w-full bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100 transition-all duration-300 border border-dashed border-zinc-800 group">
                                <Search className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
                                Wpisz kod
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg p-6">
                    <h3 className="text-zinc-200 font-medium mb-3 tracking-tight flex items-center gap-2">
                        <Clock className="h-4 w-4 text-zinc-400" />
                        Informacje o panelu
                    </h3>
                    <div className="space-y-2 text-sm text-zinc-400">
                        <p>• Wszystkie funkcje są teraz dostępne w nowym, przejrzystym interfejsie</p>
                        <p>• Użyj menu po lewej stronie, aby nawigować między sekcjami </p>
                        <p>• Twoje dane są bezpieczne i synchronizowane w czasie rzeczywistym</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
