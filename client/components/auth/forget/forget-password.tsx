"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeOff, Eye, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
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
import { authClient } from "@/lib/auth-client";
type FormData = {
    password: string;
    confirmPassword: string;
};

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


function ForgetPasswordEmailPageConfirm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [rateLimited, setRateLimited] = useState(false);
    const [isRouting, startRouting] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    if (!token) {
        return <div className="text-red-400 mt-20">Nieprawidłowy link</div>;
    }

   

    const router = useRouter();
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
            await authClient.resetPassword({
                newPassword: data.password,
                token: token,
              },
              {
                onSuccess: () => {
                    setSuccess(true);
                    setRateLimited(false);
                    setIsSubmitting(false);
                    startRouting(() => {  
                        router.push("/auth");
                    });
                },
                onError: (ctx) => {
                    if (ctx.response.status !== 429) {
                        setError(true);
                        setRateLimited(false);
                        setIsSubmitting(false);
                    }
                    setError(false);
                    setRateLimited(true);
                    setIsSubmitting(false);
                }
              }
            );
        } catch (error) {
            console.error("Error resetting password:", error);
            setError(true);
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex flex-col items-center justify-center container mx-auto max-w-md">
            <div className="w-full max-w-2xl p-8 relative border border-dashed border-zinc-800 rounded-lg">
                <div className="flex flex-col items-start justify-start pb-10 animate-fade-in-01-text opacity-0">
                    <h1 className="text-2xl text-zinc-100">Zmiana hasła</h1>
                    <p className="text-zinc-500 text-md">
                        Wprowadź swoje nowe hasło. Po zmianie zaloguj się ponownie.
                    </p>
                </div>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative w-full">
                    <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-400">Nowe hasło</FormLabel>
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
                                    <FormMessage className="text-red-400" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-400">Potwierdź nowe hasło</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input 
                                                {...field}
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="bg-zinc-950/20 border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 placeholder:text-zinc-500"
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
                                    <FormMessage className="text-red-400" />
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
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                     {isRouting ? "Przekierowanie..." : "Zmiana hasła..."}
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <Save className="mr-2 h-4 w-4" />
                                    Zmień hasło
                                </span>
                            )}
                        </Button>

                        <Link href="/auth" className="text-zinc-500 hover:text-zinc-400">Wróć do logowania</Link>

                        {error && (
                            <div className="p-3 border border-dashed border-red-800 text-red-400 rounded-md text-sm animate-fade-in-01-text">
                                Coś poszło nie tak. Proszę spróbować ponownie.
                            </div>
                        )}
                        {rateLimited && (
                            <div className="p-3 border border-dashed border-red-800 text-red-400 rounded-md text-sm animate-fade-in-01-text">
                                Wykryto podejrzane działania na Twoim koncie. Proszę spróbować ponownie później (429 - Za dużo żądań).
                            </div>
                        )}
                        {success && (
                            <div className="p-3 border border-dashed border-green-800 text-green-400 rounded-md text-sm animate-fade-in-01-text">
                                Hasło zmienione pomyślnie.
                            </div>
                        )}
                    </form>
                </Form>
            </div>
        </main>
    );
}

export default function ForgetPasswordEmailPage() {
    return (
        <Suspense fallback={<div>Ładowanie...</div>}>
            <ForgetPasswordEmailPageConfirm />
        </Suspense>
    );
}