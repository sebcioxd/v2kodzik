export default function Terms() {
    return (
        <div className="flex flex-col items-center justify-center container mx-auto max-w-xl mt-10 px-4">
            <h1 className="text-2xl text-zinc-100 tracking-tight mb-6 animate-fade-in-01-text opacity-0">Regulamin korzystania z serwisu dajkodzik.pl</h1>
            
            <div className="space-y-6 text-zinc-400 animate-slide-in-left opacity-0">
                <section className="space-y-2">
                    <h2 className="text-xl text-zinc-200">1. Postanowienia ogólne</h2>
                    <p className="text-sm">
                        Serwis dajkodzik.pl umożliwia przesyłanie i udostępnianie plików. Korzystając z serwisu, akceptujesz poniższe warunki.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl text-zinc-200">2. Zasady korzystania</h2>
                    <ul className="text-sm space-y-2">
                        <li>• Maksymalny rozmiar pojedynczego pliku: od 50MB do 2GB</li>
                        <li>• Maksymalna liczba plików w jednym przesłaniu: 20</li>
                        <li>• Nazwy plików nie mogą zawierać znaków specjalnych</li>
                        <li>• Pliki przechowywane są przez ograniczony czas</li>
                        <li>• Niedozwolone są polskie znaki w nazwach plików</li>
                        <li>• Spacje w nazwach plików są niedozwolone</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl text-zinc-200">3. Linki niestandardowe</h2>
                    <ul className="text-sm space-y-2">
                        <li>• Link musi mieć minimum 4 znaki</li>
                        <li>• Nie można używać zarezerwowanych nazw systemowych</li>
                        <li>• Niedozwolone są znaki specjalne i polskie znaki</li>
                        <li>• Link jest unikalny w systemie</li>
                        <li>• Możliwość pozostawienia pustego pola dla auto-generacji</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl text-zinc-200">4. Bezpieczeństwo</h2>
                    <ul className="text-sm space-y-2">
                        <li>• Zalecane stabilne połączenie dla plików powyżej 2MB</li>
                        <li>• Przesyłanie może zostać przerwane przy słabym połączeniu</li>
                        <li>• System automatycznie weryfikuje integralność plików</li>
                        <li>• Pliki są skanowane pod kątem złośliwego oprogramowania</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl text-zinc-200">5. Odpowiedzialność</h2>
                    <p className="text-sm">
                        Nie ponosimy odpowiedzialności za przesyłane treści. Zabrania się przesyłania treści nielegalnych lub naruszających prawa osób trzecich.
                    </p>
                    <ul className="text-sm space-y-2 mt-2">
                        <li>• Użytkownik odpowiada za zgodność plików z prawem</li>
                        <li>• Serwis może usunąć pliki naruszające regulamin</li>
                        <li>• Nie gwarantujemy dostępności plików po okresie przechowywania</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-xl text-zinc-200">6. Dane i uwierzytelnianie</h2>
                    <p className="text-sm">
                        Podczas korzystania z serwisu zbieramy i przetwarzamy niektóre dane użytkowników w celu zapewnienia bezpieczeństwa i funkcjonalności usługi.
                    </p>
                    <ul className="text-sm space-y-2 mt-2">
                        <li>• Przechowujemy podstawowe dane o przesłanych plikach</li>
                        <li>• Zbieramy informacje o adresach IP w celach bezpieczeństwa</li>
                        <li>• Używamy plików cookies do obsługi sesji</li>
                        <li>• Dane są przechowywane zgodnie z RODO</li>
                        <li>• Nie udostępniamy danych osobowych osobom trzecim</li>
                        <li>• Dane są dobrze zabezpieczone, serwis korzysta z najnowszych technologii</li>
                    </ul>
                </section>
            </div>
        </div>
    )
}
