"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Terminal, AlertCircle, Info, Upload, Code } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  searchQuery: z.string().min(1, { message: "Proszę wprowadzić tekst do wyszukania" }),
});

type FormData = z.infer<typeof formSchema>;

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [isRouting, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      searchQuery: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(false);

    try {
      startTransition(() => {
        if (activeTab === "snippet") {
          router.push(`/s/${data.searchQuery}`);
        } else {
          router.push(`/${data.searchQuery}`);
        }
      });
    } catch (error) {
      setError(true);
      setErrorMessage("Wystąpił problem podczas wyszukiwania.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset form when switching tabs
    form.reset();
  };

  return (
    <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-md max-w-sm animate-fade-in-01-text">
      <div className="w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl text-zinc-100 tracking-tight animate-fade-in-01-text opacity-0">
            Dostałeś kod od znajomego?
          </h1>
          <p className="text-zinc-500 text-md text-wrap max-w-xl animate-slide-in-left opacity-0">
            Wprowadź kod udostępniony przez znajomego, aby uzyskać dostęp do plików.
          </p>
        </div>

        <Tabs 
          defaultValue="upload" 
          className="w-full flex flex-col items-center justify-center space-y-4"
          onValueChange={handleTabChange}
        >
          <p className="text-zinc-500 text-sm animate-fade-in-01-text opacity-0">
            Wybierz typ kodu, który chcesz wyszukać.
          </p>
          <TabsList className="w-full max-w-md space-x-2 bg-transparent border-dashed border-zinc-800 relative animate-slide-in-left">
            <TabsTrigger 
              value="upload" 
              className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                        transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                        hover:bg-zinc-800/50 flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Pliki
            </TabsTrigger>
            <TabsTrigger 
              value="snippet" 
              className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                        transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                        hover:bg-zinc-800/50 flex items-center justify-center gap-2"
            >
              <Code className="h-4 w-4" />
              Kod
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="w-full mt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full max-w-md mx-auto">
                <FormField
                  control={form.control}
                  name="searchQuery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400 animate-fade-in-01-text text-md">Podaj kod pliku</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <span className="text-zinc-400 animate-fade-in-01-text bg-zinc-950/20 px-1 py-1">dajkodzik.pl/</span>
                          <Input
                            {...field}
                            placeholder="Wpisz kod pliku..."
                            className="w-full max-w-md bg-zinc-950/20 border border-zinc-800 text-zinc-200 placeholder:text-zinc-400 animate-fade-in-01-text"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 animate-fade-in-01-text" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full max-w-md bg-zinc-900 backdrop-blur-sm hover:bg-zinc-800 text-zinc-400 border border-dashed border-zinc-800"
                  disabled={isSubmitting || isRouting}
                >
                  {isSubmitting || isRouting ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />Wyszukiwanie...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Search className="mr-2 h-4 w-4" />
                      Wyszukaj
                    </span>
                  )}
                </Button>

                {error && (
                  <div className="p-3 border border-dashed border-red-800 text-red-300 text-center rounded-md text-sm animate-fade-in-01-text flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errorMessage || "Wystąpił problem podczas wyszukiwania."}
                  </div>
                )}
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="snippet" className="w-full mt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full max-w-md mx-auto">
                <FormField
                  control={form.control}
                  name="searchQuery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400 animate-fade-in-01-text text-md">Podaj kod schowka</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <span className="text-zinc-400 animate-fade-in-01-text bg-zinc-950/20 px-1 py-1 whitespace-nowrap">dajkodzik.pl/s/</span>
                          <Input
                            {...field}
                            placeholder="Wpisz kod snippetu..."
                            className="w-full max-w-md bg-zinc-950/20 border border-zinc-800 text-zinc-200 placeholder:text-zinc-400 animate-fade-in-01-text"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 animate-fade-in-01-text" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full max-w-md bg-zinc-900 backdrop-blur-sm hover:bg-zinc-800 text-zinc-400 border border-dashed border-zinc-800"
                  disabled={isSubmitting || isRouting}
                >
                  {isSubmitting || isRouting ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />Wyszukiwanie...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Search className="mr-2 h-4 w-4" />
                      Wyszukaj
                    </span>
                  )}
                </Button>

                {error && (
                  <div className="p-3 border border-dashed border-red-800 text-red-300 text-center rounded-md text-sm animate-fade-in-01-text flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errorMessage || "Wystąpił problem podczas wyszukiwania."}
                  </div>
                )}
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        <section className="mt-4 flex justify-start items-start w-full animate-slide-in-left">
          <Alert className="bg-zinc-950/10 border-zinc-800 border-dashed text-zinc-400">
            <Terminal className="h-4 w-4" />
            <AlertTitle className="text-md">Jak to działa?</AlertTitle>
            <AlertDescription className="text-md">
              Każdy udostępniony plik ma unikalny kod. Wpisz kod, który otrzymałeś, aby uzyskać dostęp do plików. 
              Jeśli plik jest chroniony hasłem, zostaniesz poproszony o podanie kodu dostępu.
            </AlertDescription>
          </Alert>
        </section>
        
        <div className="mt-2 p-3 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/30 animate-slide-in-bottom">
          <p className="text-zinc-400 text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>Chcesz udostępnić własne pliki?</span>
            <Link href="/upload" className="text-zinc-300 hover:text-zinc-100 transition-colors underline underline-offset-4">
              Prześlij teraz
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

