import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload } from "lucide-react"
import { ArrowRight } from "lucide-react"

const SchowekPage = () => {
  return (
    <div className='flex flex-col items-center justify-center mx-auto md:max-w-4xl max-w-md pt-10'>
      <h1 className="md:text-2xl text-xl font-bold tracking-tighter animate-fade-in-01-text opacity-0 bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              pobierz inf04-auto-test
            </h1>
            <Link href="https://cdn.dajkodzik.pl/inf04-auto-test-main.zip" className="flex-1">
              <Button size="sm" className="w-full text-xs bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800/60 hover:text-zinc-100 transition-all duration-100 animate-fade-in-01-text border border-dashed border-zinc-800 group mt-4">
                <Upload className="w-4 h-4" />
                Pobierz plik
                <ArrowRight className="w-4 h-4  group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="https://github.com/kapekkkk/inf04-auto-test" target="_blank" className="text-zinc-400 text-xs mt-5 hover:text-zinc-100 transition-all duration-100 animate-fade-in-01-text">Odwiedź repozytorium</Link> 
    </div>
  )
}

export default SchowekPage
