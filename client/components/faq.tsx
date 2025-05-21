import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"
import Link from "next/link"
export default function FAQ() {
  return (
    <main className="flex flex-col items-center justify-center w-full max-w-md mx-auto animate-fade-in-01-text">
      <div className="text-center space-y-2">
          <h1 className="text-2xl text-zinc-100 tracking-tight animate-fade-in-01-text opacity-0">Pytania i odpowiedzi</h1>
          <p className="text-zinc-500 text-sm text-wrap max-w-xl animate-slide-in-left opacity-0 mb-4">
            Odpowiedzi na najczęstsze pytania dotyczące działania serwisu.
          </p>
        </div>
      <Accordion type="single" collapsible className="w-full space-y-4">
        <AccordionItem value="item-1" className="border border-dashed border-zinc-800 rounded-md px-4 bg-zinc-950/10">
            <AccordionTrigger className="text-zinc-200 hover:text-zinc-100 hover:no-underline">
              Ile trwa dostęp do linku?
            </AccordionTrigger>
            <AccordionContent className="text-zinc-400 text-sm">
              Link jest dostępny przez 24 godziny.
            </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-2" className="border border-dashed border-zinc-800 rounded-md px-4 bg-zinc-950/10">
            <AccordionTrigger className="text-zinc-200 hover:text-zinc-100 hover:no-underline">
              Jakie są ograniczenia dotyczące plików?
            </AccordionTrigger>
            <AccordionContent className="text-zinc-400 text-sm">
              Maksymalnie 20 plików, 40MB maksymalnie.
            </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="item-3" className="border border-dashed border-zinc-800 rounded-md px-4 bg-zinc-950/10">
            <AccordionTrigger className="text-zinc-200 hover:text-zinc-100 hover:no-underline">
              Jakie są limity dotyczące linków?
            </AccordionTrigger>
            <AccordionContent className="text-zinc-400 text-sm">
              Nasze API ogranicza do 3 linków co 10-20 minut na jeden adres IP.
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="border border-dashed border-zinc-800 rounded-md px-4 bg-zinc-950/10">
            <AccordionTrigger className="text-zinc-200 hover:text-zinc-100 hover:no-underline">
              Jak skontaktować się z administratorem?
            </AccordionTrigger>
            <AccordionContent className="text-zinc-400 text-sm">
              Napisz do mnie na discord: @niarde lub telegram: @niardeee, również możesz skontaktować się formularzem na stronie <Link href="https://niarde.xyz" className="text-zinc-300 hover:text-zinc-100 transition-colors underline underline-offset-4">niarde.xyz</Link>
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5" className="border border-dashed border-zinc-800 rounded-md px-4 bg-zinc-950/10">
            <AccordionTrigger className="text-zinc-200 hover:text-zinc-100 hover:no-underline">
              Czy kod źródłowy jest dostępny?
            </AccordionTrigger>
            <AccordionContent className="text-zinc-400 text-sm">
              Obecnie program nie jest open source. W przyszłości może się to zmienić.
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6" className="border border-dashed border-zinc-800 rounded-md px-4 bg-zinc-950/10">
            <AccordionTrigger className="text-zinc-200 hover:text-zinc-100 hover:no-underline">
              Czy prywatne linki są bezpieczne?
            </AccordionTrigger>
            <AccordionContent className="text-zinc-400 text-sm">
              Tak, prywatne linki są bezpieczne. Jest to bardzo dopracowana funkcja, poza osobami z kodem dostępu, nikt nie jest w stanie otworzyć linku. (Wszystkie dane są po stronie serwera)
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-7" className="border border-dashed border-zinc-800 rounded-md px-4 bg-zinc-950/10">
            <AccordionTrigger className="text-zinc-200 hover:text-zinc-100 hover:no-underline">
              Czy ten serwis jest darmowy?
            </AccordionTrigger>
            <AccordionContent className="text-zinc-400 text-sm">
              Tak, ten serwis jest darmowy, bezpieczny oraz bez reklam. Jest to dlatego, ponieważ stanowi on bardzo jako bardzo dobry projekt do Portfolio.
            </AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  );
}
