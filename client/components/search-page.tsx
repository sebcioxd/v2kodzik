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
    <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-sm max-w-sm animate-fade-in-01-text">
      <div className="w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl text-zinc-200 tracking-tight animate-fade-in-01-text opacity-0">
            Dostałeś kod od znajomego?
          </h1>
          <p className="text-zinc-400 text-md tracking-tight animate-slide-in-left opacity-0">
            Wprowadź kod udostępniony przez znajomego, aby uzyskać dostęp do plików.
          </p>
        </div>

        <Tabs 
          defaultValue="upload" 
          className="w-full flex flex-col items-center justify-center space-y-4"
          onValueChange={handleTabChange}
        >
          <p className="text-zinc-400 text-sm tracking-tight animate-fade-in-01-text opacity-0">
            Wybierz typ linku, który chcesz wyszukać.
          </p>
          <TabsList className="w-full max-w-md space-x-2 bg-transparent border-dashed border-zinc-800 tracking-tight relative animate-slide-in-left">
            <TabsTrigger 
              value="upload" 
              className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                        transition-all duration-75 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                        hover:bg-zinc-800/40 flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Pliki
            </TabsTrigger>
            <TabsTrigger 
              value="snippet" 
              className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                        transition-all duration-75 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                        hover:bg-zinc-800/40 flex items-center justify-center gap-2"
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
                      <FormLabel className={`text-zinc-200 animate-fade-in-01-text border-dashed tracking-tight border-zinc-800 border-b pb-3 mb-2 ${isSubmitting ? "opacity-50" : ""}`}>
                        <Search className="w-4 h-4" /> Podaj kod pliku:
                      </FormLabel>
                      <FormControl>
                        <div className="w-full">
                          <div className="flex items-center w-full backdrop-blur-sm border border-dashed border-zinc-800 rounded-sm overflow-hidden group transition-all duration-300 hover:bg-zinc-800/40">
                            <span className="text-zinc-400 px-2 border-r border-dashed border-zinc-800 bg-zinc-950/20 text-sm h-8 flex items-center">
                              dajkodzik.pl/
                            </span>
                            <Input
                              {...field}
                              placeholder="Wpisz kod pliku..."
                              className="flex-1 border-0 bg-transparent text-zinc-200 text-sm h-8
                                placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                              disabled={isSubmitting || isRouting}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 animate-fade-in-01-text" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-zinc-900 backdrop-blur-sm hover:bg-zinc-800 duration-50 text-zinc-400 
                    animate-slide-in-left"
                  disabled={isSubmitting || isRouting}
                  size="sm"
                >
                  {isSubmitting || isRouting ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Wyszukiwanie...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Search className="mr-2 h-4 w-4" />
                      Wyszukaj
                    </span>
                  )}
                </Button>

                {error && (
                  <div className="p-2.5 border border-dashed border-red-800/50 bg-red-950/10 text-red-400 
                    text-center rounded-sm text-sm animate-fade-in-01-text tracking-tight">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
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
                      <FormLabel className={`text-zinc-200 animate-fade-in-01-text border-dashed tracking-tight border-zinc-800 border-b pb-3 mb-2 ${isSubmitting ? "opacity-50" : ""}`}>
                        <Search className="w-4 h-4" /> Podaj kod schowka:
                      </FormLabel>
                      <FormControl>
                        <div className="w-full">
                          <div className="flex items-center w-full backdrop-blur-sm border border-dashed border-zinc-800 rounded-sm overflow-hidden group transition-all duration-300 hover:bg-zinc-800/40">
                            <span className="text-zinc-400 px-2 border-r border-dashed border-zinc-800 bg-zinc-950/20 text-sm h-8 flex items-center whitespace-nowrap">
                              dajkodzik.pl/s/
                            </span>
                            <Input
                              {...field}
                              placeholder="Wpisz kod snippetu..."
                              className="flex-1 border-0 bg-transparent text-zinc-200 text-sm h-8
                                placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                              disabled={isSubmitting || isRouting}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 animate-fade-in-01-text" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-zinc-900 backdrop-blur-sm hover:bg-zinc-800 duration-50 text-zinc-400 
                    animate-slide-in-left"
                  disabled={isSubmitting || isRouting}
                  size="sm"
                >
                  {isSubmitting || isRouting ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Wyszukiwanie...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Search className="mr-2 h-4 w-4" />
                      Wyszukaj
                    </span>
                  )}
                </Button>

                {error && (
                  <div className="p-2.5 border border-dashed border-red-800/50 bg-red-950/10 text-red-400 
                    text-center rounded-sm text-sm animate-fade-in-01-text tracking-tight">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    {errorMessage || "Wystąpił problem podczas wyszukiwania."}
                  </div>
                )}
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        <section className="mt-4 flex justify-start items-start w-full animate-slide-in-left">
          <Alert className="bg-zinc-950/20 border-zinc-800 border-dashed text-zinc-400 backdrop-blur-sm">
            <Terminal className="h-4 w-4" />
            <AlertTitle className="text-md tracking-tight text-zinc-200">Jak to działa?</AlertTitle>
            <AlertDescription className="text-sm tracking-tight">
              Każdy udostępniony plik ma unikalny kod. Wpisz kod, który otrzymałeś, aby uzyskać dostęp do plików. 
              Jeśli plik jest chroniony hasłem, zostaniesz poproszony o podanie kodu dostępu.
            </AlertDescription>
          </Alert>
        </section>
        
        <div className="mt-2 p-2.5 border border-dashed border-zinc-800 rounded-sm bg-zinc-950/20 backdrop-blur-sm animate-slide-in-bottom">
          <p className="text-zinc-400 text-sm flex items-center gap-2 tracking-tight">
            <Info className="h-4 w-4" />
            <span>Chcesz udostępnić własne pliki?</span>
            <Link href="/upload" className="text-zinc-200 hover:text-zinc-100 transition-colors underline underline-offset-4">
              Prześlij teraz
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

