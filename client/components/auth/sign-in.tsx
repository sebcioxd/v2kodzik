"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
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
import Google from "./google";
import Discord from "./discord";
import { toast } from "sonner";
import { useQueryState } from "nuqs";

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
  const [email] = useQueryState("email");
  const [rememberMe] = useQueryState("rememberMe");

  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: email || "",
      password: "",
      rememberMe: rememberMe === "true" ? true : false,
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
              router.push("/panel");
              refetch();
            });
          },

          onError: (ctx) => {
            if (ctx.response.status === 307) {
              toast.info("Wykryliśmy zmianę urządzenia. Proszę wprowadzić kod 2FA.");
              router.push(`/auth/2fa?token=${ctx.error.authToken}&email=${ctx.error.email}&rememberMe=${data.rememberMe}`);
            } else {
              setError(true);
              setRateLimited(false);
              setIsSubmitting(false);
            }
            
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
    <main className="flex flex-col items-center justify-center container mx-auto max-w-[26rem] animate-slide-in-left">
      <div className="w-full max-w-2xl p-8 relative border border-dashed border-zinc-800 backdrop-blur-sm rounded-lg">
        <div className="flex flex-col items-center justify-center pb-6 animate-fade-in-01-text opacity-0">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
            Zaloguj się
          </h1>
          <p className="text-zinc-500 text-sm">
            Witaj z powrotem! Proszę wprowadzić swoje dane
          </p>
        </div>

        <div className="space-y-4 mb-6 animate-slide-in-left flex flex-col items-center justify-center">
          <Google />
          <Discord />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-dashed border-zinc-800"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-2 text-zinc-400 z-10">lub kontynuuj z emailem</span>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 relative w-full"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-200 animate-fade-in-01-text text-sm pb-1">
                    Adres email
                  </FormLabel>
                  <FormControl>
                    <div className="w-full">
                      <div className="flex items-center w-full backdrop-blur-sm border border-dashed border-zinc-800 rounded-sm overflow-hidden group transition-all duration-300 hover:bg-zinc-800/50">
                        <Input
                          {...field}
                          type="email"
                          className="flex-1 border-0 bg-transparent text-zinc-200 text-sm placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                          placeholder="twój.email@przykład.com"
                        />
                      </div>
                    </div>
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
                  <FormLabel className="text-zinc-200 animate-fade-in-01-text text-sm pb-1">
                    Hasło
                  </FormLabel>
                  <FormControl>
                    <div className="w-full">
                      <div className="flex items-center w-full backdrop-blur-sm border border-dashed border-zinc-800 rounded-sm overflow-hidden group transition-all duration-300 hover:bg-zinc-800/50">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          className="flex-1 border-0 bg-transparent text-zinc-200 text-sm placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                          placeholder="Wprowadź swoje hasło"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="px-3 text-zinc-500 hover:text-zinc-400 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400 animate-fade-in-01-text" />
                  <Link
                    href="/auth/forget"
                    className="text-zinc-500 hover:text-zinc-400 text-sm"
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
                      className="data-[state=checked]:bg-zinc-700 border-zinc-900"
                    />
                  </FormControl>
                  <div className="flex flex-col ml-2">
                    <FormLabel className="text-zinc-200 font-normal text-sm">
                      Zapamiętaj mnie
                    </FormLabel>
                    <FormDescription className="text-zinc-500 text-sm">
                      Nie wylogujesz się po zamknięciu przeglądarki.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-zinc-900 backdrop-blur-sm border border-dashed border-zinc-800 hover:bg-zinc-800 duration-50 text-zinc-300"
              disabled={isSubmitting || isRouting}
              size="sm"
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