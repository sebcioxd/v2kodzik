"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
    FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

const formSchema = z.object({
  searchQuery: z.string().min(1, { message: "Proszę wprowadzić tekst do wyszukania" }),
});

type FormData = z.infer<typeof formSchema>;

export default function SearchPage() {
  const [isRouting, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      searchQuery: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      startTransition(() => {
        router.push(`/${data.searchQuery}`);
      });
    } catch (error) {
      setError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full  max-w-md mx-auto">
        <FormField
          control={form.control}
          name="searchQuery"
          render={({ field }) => (
            <FormItem>
            <FormLabel className="text-zinc-400 animate-fade-in-01-text">Podaj kod od znajomego</FormLabel>
              <FormControl>
              <div className="flex items-center gap-2">
              <span className="text-zinc-400 animate-fade-in-01-text bg-zinc-950/20 border-zinc-800 rounded-md px-1 py-1">dajkodzik.pl/</span>
                <Input
                  {...field}
                  placeholder="Wyszukaj..."
                  className="w-full max-w-md bg-zinc-950/20 border-zinc-800 text-zinc-200 placeholder:text-zinc-400 animate-fade-in-01-text"
                />
                </div>
              </FormControl>
              <FormMessage className="text-red-400 animate-fade-in-01-text" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full max-w-md bg-zinc-900 backdrop-blur-sm hover:bg-zinc-800 text-zinc-400"
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
          <div className="p-2 border border-dashed border-red-800 text-red-300 text-center rounded-md text-sm animate-fade-in-01-text max-w-md">
            Wystąpił problem podczas wyszukiwania.
          </div>
        )}

        
      </form>
    </Form>
  );
}

