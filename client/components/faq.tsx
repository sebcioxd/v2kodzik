import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"

export default function FAQ() {
  return (
    <main className="flex flex-col items-center justify-center w-full max-w-md mx-auto animate-fade-in-01-text">
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
              Maksymalnie 3 linki co 10-20 minut na jeden adres IP.
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="border border-dashed border-zinc-800 rounded-md px-4 bg-zinc-950/10">
            <AccordionTrigger className="text-zinc-200 hover:text-zinc-100 hover:no-underline">
              Jak skontaktować się z administratorem?
            </AccordionTrigger>
            <AccordionContent className="text-zinc-400 text-sm">
              Napisz do mnie na discord: @niarde lub telegram: @niardeee
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
      </Accordion>
    </main>
  );
}
