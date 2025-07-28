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
import { Code2, Link as LinkIcon, Clock, Loader2, Rss } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  { value: "jsx", label: "JSX" },
  { value: "tsx", label: "TSX" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "php", label: "PHP" }, 
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "markup", label: "HTML/XML" },
  { value: "css", label: "CSS" },
  { value: "txt", label: "Plik tekstowy" },
  { value: "go", label: "Go" },
  { value: "csharp", label: "C#" },
  { value: "ruby", label: "Ruby" },
  { value: "rust", label: "Rust" },
  { value: "yaml", label: "YAML" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "objectivec", label: "Objective-C" },
  { value: "reason", label: "Reason" },
  { value: "graphql", label: "GraphQL" },
  { value: "markdown", label: "Markdown" },
  { value: "json", label: "JSON" },
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Code Input Section */}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={`text-zinc-200 animate-fade-in-01-text border-dashed tracking-tight border-zinc-800 border-b pb-3 mb-2 ${isSubmitting ? "opacity-50" : ""}`}>
                <Code2 className="w-4 h-4" /> Kod do wysłania:
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  disabled={isSubmitting}
                  placeholder="Wklej swój kod tutaj..."
                  className="min-h-[300px] w-full md:min-w-sm max-w-md animate-fade-in-01-text tracking-tight
                    bg-transparent border border-dashed border-zinc-800 text-zinc-200 
                    placeholder:text-zinc-400 hover:bg-zinc-950/30 backdrop-blur-sm
                    focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200"
                />
              </FormControl>
              <FormMessage className="text-red-400 animate-fade-in-01-text" />
            </FormItem>
          )}
        />

        {/* Language Selection */}
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={`text-zinc-200 animate-fade-in-01-text tracking-tight border-dashed border-zinc-800 border-b pb-3 mb-2 ${isSubmitting ? "opacity-50" : ""}`}>
                <Rss className="w-4 h-4" /> Język programowania:
              </FormLabel>
              <Select
                disabled={isSubmitting}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full max-w-md bg-transparent border border-dashed border-zinc-800 
                    text-zinc-200 hover:bg-zinc-950/30 backdrop-blur-sm tracking-tight h-9">
                    <SelectValue placeholder="Wybierz język programowania" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent 
                  className="w-full max-w-[16rem] max-h-[20rem] bg-zinc-950/70 backdrop-blur-sm border border-dashed border-zinc-800 
                    shadow-lg animate-in fade-in-0 zoom-in-95"
                >
                  {PROGRAMMING_LANGUAGES.map((language) => (
                    <SelectItem
                      key={language.value}
                      value={language.value}
                      className="text-sm text-zinc-200 h-8 px-2
                        hover:bg-zinc-800/40 focus:bg-zinc-800/40
                        tracking-tight cursor-pointer
                        transition-all duration-75 ease-out
                        data-[highlighted]:bg-zinc-800/40 data-[highlighted]:text-zinc-200"
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

        {/* Custom Slug Section */}
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={`text-zinc-200 animate-fade-in-01-text text-sm pb-1 ${isSubmitting ? "opacity-50" : ""}`}>
                <LinkIcon className="w-4 h-4" /> Niestandarowy link: 
                <span className="text-zinc-600 animate-fade-in-01-text ml-1">opcjonalne</span>
              </FormLabel>
              <FormControl>
                <div className="w-full max-w-md">
                  <div className="flex items-center w-full backdrop-blur-sm border border-dashed border-zinc-800 rounded-sm overflow-hidden group transition-all duration-300 hover:bg-zinc-800/50">
                    <span className="text-zinc-400 px-2 border-r border-dashed border-zinc-800 bg-zinc-950/20 text-sm">
                      dajkodzik.pl/s/
                    </span>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      placeholder="np. moj-kod"
                      className="flex-1 border-0 bg-transparent text-zinc-200 text-sm 
                        placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                    />
                  </div>
                </div>
              </FormControl>
              <p className={`text-sm text-zinc-400 mt-1 tracking-tight ${isSubmitting ? "opacity-50" : ""}`}>
                Wpisz własną nazwę lub zostaw puste dla auto-generacji.
              </p>
              <FormMessage className="text-red-400 animate-fade-in-01-text" />
            </FormItem>
          )}
        />

        {/* Time Setting */}
        <div className="w-full animate-fade-in-01-text">
          <h4 className="text-zinc-300 mb-2 text-sm font-medium tracking-tight">Jak długo kod ma być dostępny?</h4>
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Tabs
                    value={field.value}
                    onValueChange={field.onChange}
                    className="w-full animate-slide-in-left"
                  >
                    <TabsList className="w-full space-x-2 bg-transparent border-dashed border-zinc-800 tracking-tight">
                      <TabsTrigger
                        value="24"
                        className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 
                          text-zinc-400 transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200 
                          hover:bg-zinc-800/50"
                        disabled={isSubmitting}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        24 godziny
                      </TabsTrigger>
                      <TabsTrigger
                        value="168"
                        className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 
                          text-zinc-400 transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200 
                          hover:bg-zinc-800/50"
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
          className="w-full bg-zinc-900 backdrop-blur-sm hover:bg-zinc-800 duration-50 text-zinc-400 
            animate-slide-in-left"
          disabled={isSubmitting}
          size="sm"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              Zapisywanie kodu...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Code2 className="mr-2 h-4 w-4" />
              Wygeneruj link z kodem
            </span>
          )}
        </Button>

        {/* Status Messages */}
        {error && (
          <div className="p-2.5 border border-dashed border-red-800/50 bg-red-950/10 text-red-400 
            text-center rounded-sm text-sm animate-fade-in-01-text tracking-tight">
            {errorMessage}
          </div>
        )}

        {success && (
          <div className="p-2.5 border border-dashed border-green-800/50 bg-green-950/10 text-green-400 
            text-center rounded-sm text-sm animate-fade-in-01-text tracking-tight">
            Kod został pomyślnie zapisany.
          </div>
        )}
      </form>
    </Form>
  );
}