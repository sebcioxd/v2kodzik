"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
type FormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Adres email jest wymagany" })
    .email({ message: "Nieprawidłowy adres email" }),
  password: z
    .string()
    .min(6, { message: "Hasło musi mieć co najmniej 6 znaków" }),
  rememberMe: z.boolean(),
}) satisfies z.ZodType<FormData>;

export default function SignIn() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [isRouting, startRouting] = useTransition();
  const { refetch } = useSession();
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await authClient.signIn.email(
        {
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        },
        {
          onSuccess: () => {
            setSuccess(true);
            setRateLimited(false);
            setIsSubmitting(false);
            startRouting(() => {
              router.push("/");
              refetch();
            });
          },

          onError: (c) => {
            setError(true);
            setRateLimited(false);
            setIsSubmitting(false);
          },

          onRequest: () => {
            setIsSubmitting(true);
          },

          onResponse: () => {
            setIsSubmitting(false);
          },
          
        }
      );
    } catch (error) {
      console.error("Error signing in:", error);
      setError(true);
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center container mx-auto max-w-md">
      <div className="w-full max-w-2xl p-8 relative border border-dashed border-zinc-800 rounded-lg">
        <div className="flex flex-col items-start justify-start pb-10 animate-fade-in-01-text opacity-0">
          <h1 className="text-xl text-zinc-100">
            Zaloguj się
          </h1>
          <p className="text-zinc-500 text-xs">
            Witaj z powrotem! Proszę wprowadzić swoje dane
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 relative w-full"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400 ">Adres email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      className="bg-zinc-950/20 border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 placeholder:text-zinc-500"
                      placeholder="twój.email@przykład.com"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 animate-fade-in-01-text" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Hasło</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        className="bg-zinc-950/20 border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 placeholder:text-zinc-500"
                        placeholder="Wprowadź swoje hasło"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400 animate-fade-in-01-text" />
                  <Link
                    href="/auth/forget"
                    className="text-zinc-500 hover:text-zinc-400"
                  >
                    Zapomniałeś hasła?
                  </Link>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-zinc-700 border-dashed border-zinc-800"
                    />
                  </FormControl>
                  <div className="flex flex-col ml-2">
                    <FormLabel className="text-zinc-400 font-normal">
                      Zapamiętaj mnie
                    </FormLabel>
                    <FormDescription className="text-zinc-500">
                      Nie wylogujesz się po zamknięciu przeglądarki.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-zinc-900/20 border border-dashed border-zinc-800 backdrop-blur-sm hover:bg-zinc-800 text-zinc-400 animate-slide-in-left"
              disabled={isSubmitting || isRouting}
            >
              {isSubmitting || isRouting ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRouting ? "Przekierowanie..." : "Logowanie..."}
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  Zaloguj się
                </span>
              )}
            </Button>

            {error && (
              <div className="p-3 border border-dashed border-red-800 text-red-400 rounded-md text-sm animate-fade-in-01-text">
                Nieprawidłowy adres email lub hasło. Proszę spróbować ponownie.
              </div>
            )}
            {rateLimited && (
              <div className="p-3 border border-dashed border-red-800 text-red-400 rounded-md text-sm animate-fade-in-01-text">
                Wykryto podejrzane działania na Twoim koncie. Proszę spróbować
                ponownie później (429 - Za dużo żądań).
              </div>
            )}
            {success && (
              <div className="p-3 border border-dashed border-green-800 text-green-400 rounded-md text-sm animate-fade-in-01-text">
                Zalogowanie się powiodło. Przekierowanie...
              </div>
            )}
          </form>
        </Form>
      </div>
    </main>
  );
}