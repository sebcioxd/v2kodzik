"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient, User } from "@/lib/auth-client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type FormData = {
  password: string;
  confirmPassword: string;
};

interface ApiErrorResponse {
  message: string;
}

const formSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Hasło musi mieć co najmniej 8 znaków" }),
  confirmPassword: z
    .string()
    .min(1, { message: "Proszę potwierdzić swoje hasło" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hasła nie pasują do siebie",
  path: ["confirmPassword"],
});

export default function OAuthPasswordSetup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRouting, startRouting] = useTransition();
  const [isSkipping, setIsSkipping] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/oauth/password-update`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ password: data.password }),
      });

      const responseData = await response.json() as ApiErrorResponse;
      
      if (!response.ok) {
        setError(true);
        setErrorMessage(responseData.message);
        return;
      }
      setSuccess(true);
      setError(false);

      await authClient.signOut({
        fetchOptions: {
            credentials: "include",
            onSuccess: () => {
                setIsSkipping(false);
                startRouting(() => {
                    router.push("/auth");
                });
            },
        },
    });

    } catch (error) {
      console.error("Error updating password:", error);
      setError(true);
      setErrorMessage("Wystąpił nieoczekiwany błąd podczas ustawiania hasła.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setIsSkipping(true);
    startRouting(() => {
      router.push('/panel');
    });
  };

  return (
    <main className="flex flex-col items-center justify-center container mx-auto max-w-md animate-slide-in-bottom mt-10">
      <div className="w-full max-w-2xl p-8 relative border border-zinc-800 rounded-lg">
        <div className="flex flex-col items-center justify-center pb-10 animate-fade-in-01-text opacity-0">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Ustaw hasło
          </h1>
          <p className="text-zinc-500 text-md">
            Możesz teraz ustawić hasło do swojego konta
          </p>
        </div>

        <div className="p-4 mb-6 border border-dashed border-zinc-800 rounded-md">
          <p className="text-zinc-400 text-sm">
            Jesteś zalogowany przez OAuth. Ustawienie hasła pozwoli Ci na bezpośrednie logowanie 
            przez email w przyszłości. Możesz pominąć ten krok i kontynuować korzystanie tylko z 
            logowania OAuth.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative w-full">
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
                        className="bg-zinc-950/20 border-zinc-800 backdrop-blur-sm text-zinc-200 placeholder:text-zinc-500"
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Potwierdź hasło</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        className="bg-zinc-950/20 border-zinc-800 backdrop-blur-sm text-zinc-200 placeholder:text-zinc-500"
                        placeholder="Potwierdź swoje hasło"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400 animate-fade-in-01-text" />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1 bg-zinc-900/20 border border-zinc-900 backdrop-blur-sm hover:bg-zinc-800 text-zinc-400 animate-slide-in-left"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ustawianie hasła...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <KeyRound className="mr-2 h-4 w-4" />
                    Ustaw hasło
                  </span>
                )}
              </Button>

              <Button
                type="button"
                onClick={handleSkip}
                className="flex-1 bg-zinc-900/20 border border-zinc-900 backdrop-blur-sm hover:bg-zinc-800 text-zinc-400"
                disabled={isSkipping}
              >
                {isSkipping ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Przekierowanie...
                  </span>
                ) : (
                  "Pomiń"
                )}
              </Button>
            </div>

            <span className="text-zinc-400 text-sm">
              Będziesz mógł także ustawić hasło w panelu użytkownika.
            </span>

            {error && (
              <div className="p-3 border border-dashed border-red-800 text-red-400 rounded-md text-sm animate-fade-in-01-text">
                {errorMessage || "Wystąpił błąd podczas ustawiania hasła. Proszę spróbować ponownie."}
              </div>
            )}
            {success && (
              <div className="p-3 border border-dashed border-green-800 text-green-400 rounded-md text-sm animate-fade-in-01-text">
                Hasło zostało pomyślnie ustawione. Przekierowanie...
              </div>
            )}
          </form>
        </Form>
      </div>
    </main>
  );
}