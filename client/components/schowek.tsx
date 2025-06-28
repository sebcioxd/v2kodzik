"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Code2, Link as LinkIcon, Clock, EyeOff, Megaphone, Lock, Rss } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  code: z.string().min(1, { message: "Kod nie może być pusty" }),
  language: z.string().min(1, { message: "Wybierz język programowania" }),
  slug: z
    .string()
    .trim()
    .min(4, { message: "Nazwa linku musi mieć przynajmniej 4 znaki" })
    .max(16, { message: "Nazwa linku może mieć maksymalnie 16 znaków" })
    .refine(
      (value) => {
        const restrictedPaths = [
          "/upload",
          "/search",
          "/faq",
          "/api",
          "/admin",
          "/auth",
          "/panel",
          "/success",
          "/schowek",
        ];
        return !restrictedPaths.some(
          (path) =>
            value.toLowerCase().trim() === path.replace("/", "").trim() ||
            value.toLowerCase().trim().startsWith(path.replace("/", "").trim())
        );
      },
      { message: "Ta nazwa jest zarezerwowana dla systemu" }
    )
    .refine(
      (value) => {
        const invalidChars = /[\(\)ąćęłńóśźżĄĆĘŁŃÓŚŹŻ%/]/;
        return !invalidChars.test(value);
      },
      {
        message: "Link nie może zawierać niedozwolonych znaków",
      }
    )
    .optional()
    .or(z.literal("")),
  time: z.string(),
});

const PROGRAMMING_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "tsx", label: "Typescript React" },
  { value: "jsx", label: "Javascript React" },
  { value: "python", label: "Python" },
  { value: "php", label: "PHP" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "shell", label: "Shell" },
];

export default function Schowek() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      language: "",
      slug: "",
      time: "24",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setError(false);
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/snippet/create`,
        {
          code: data.code,
          language: data.language,
          slug: data.slug,
          time: data.time,
        },
        {
          withCredentials: true,
        }
      );

      setSuccess(true);
      form.reset();
      router.push(`/success?slug=${response.data.slug}&time=${data.time}&type=snippet`);
    } catch (error) {
      setError(true);
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(error.response.data.message || "Nie udało się zapisać kodu");
      } else {
        setErrorMessage("Wystąpił nieoczekiwany błąd");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 animate-fade-in-01-text">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem className="animate-fade-in-01-text">
              <FormLabel className="text-zinc-200 border-dashed border-zinc-700 border-b pb-3 mb-4 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-zinc-400" /> 
                <span className="font-medium">Twój kod:</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  disabled={isSubmitting}
                  placeholder="Wklej swój kod tutaj..."
                  className="min-h-[300px] w-full md:min-w-lg max-w-md bg-zinc-950/20 border-zinc-800 
                    text-zinc-200 placeholder:text-zinc-500 focus:ring-zinc-700 focus:border-zinc-700
                    transition-all duration-200 hover:bg-zinc-950/30"
                />
              </FormControl>
              <FormMessage className="text-red-400 animate-fade-in-01-text" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem className="animate-fade-in-01-text">
              <FormLabel className="text-zinc-200 border-dashed border-zinc-700 border-b pb-3 mb-4 flex items-center gap-2">
                <Rss className="w-4 h-4 text-zinc-400" />
                <span className="font-medium">Język programowania:</span>
              </FormLabel>
              <Select
                disabled={isSubmitting}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="bg-zinc-950/20 border-zinc-800 text-zinc-200 
                    hover:bg-zinc-950/30 transition-colors duration-200">
                    <SelectValue placeholder="Wybierz język programowania" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {PROGRAMMING_LANGUAGES.map((language) => (
                    <SelectItem
                      key={language.value}
                      value={language.value}
                      className="text-zinc-200 hover:bg-zinc-800 transition-colors duration-150"
                    >
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-red-400 animate-fade-in-01-text" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem className="animate-fade-in-01-text">
              <FormLabel className="text-zinc-200 border-dashed border-zinc-700 border-b pb-3 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-zinc-400" /> 
                <span className="font-medium">Niestandarowy link:</span>
                <span className="text-zinc-500 text-sm">(opcjonalnie)</span>
              </FormLabel>
              <FormControl>
                <div className="flex items-center gap-2 py-2 mt-2">
                  <span className="text-zinc-400 bg-zinc-950/20 flex-shrink-0">
                    dajkodzik.pl/s/
                  </span>
                  <Input
                    {...field}
                    disabled={isSubmitting}
                    placeholder="np. moj-kod"
                    className="w-full bg-zinc-950/20 border-zinc-800 text-zinc-200 
                      placeholder:text-zinc-500 focus:ring-zinc-700 focus:border-zinc-700
                      transition-all duration-200 hover:bg-zinc-950/30"
                  />
                </div>
              </FormControl>
              <FormMessage className="text-red-400 animate-fade-in-01-text" />
            </FormItem>
          )}
        />

        {/* Time Setting */}
        <div className="w-full animate-fade-in-01-text">
          <h3 className="text-zinc-200 mb-4 text-md border-b border-dashed border-zinc-800 pb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span className="font-medium">Jak długo kod ma być dostępny?</span>
          </h3>
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Tabs
                    defaultValue="24"
                    onValueChange={field.onChange}
                    value={field.value}
                    className="w-full"
                  >
                    <TabsList className="w-full space-x-3 bg-transparent">
                      <TabsTrigger
                        value="24"
                        className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 p-2.5 text-zinc-400 
                          data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                          hover:bg-zinc-950/30 transition-all duration-200"
                        disabled={isSubmitting}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        24 godziny
                      </TabsTrigger>
                      <TabsTrigger
                        value="168"
                        className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 p-2.5 text-zinc-400 
                          data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                          hover:bg-zinc-950/30 transition-all duration-200"
                        disabled={isSubmitting}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        7 dni
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 
            transition-all duration-200 animate-fade-in-01-text
            border border-dashed border-zinc-800 hover:border-zinc-700 group"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-zinc-400 border-t-transparent rounded-full" />
              Zapisywanie...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Code2 className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              Zapisz i wygeneruj link
            </span>
          )}
        </Button>

        {error && (
          <div className="p-2.5 border border-dashed border-red-800/50 bg-red-950/10 text-red-300 
            text-center rounded-md text-sm animate-fade-in-01-text">
            {errorMessage}
          </div>
        )}

        {success && (
          <div className="p-2.5 border border-dashed border-green-800/50 bg-green-950/10 text-green-300 
            text-center rounded-md text-sm animate-fade-in-01-text">
            Kod został pomyślnie zapisany.
          </div>
        )}
      </form>
    </Form>
  );
}