"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import Google from "./google";

type FormData = {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
};

type apiResponse = {
    remoteAdress: string;
    remoteAdress_v6: string;
    userAgent: string;
    referer: string;
    nodeVersion: string;
    port: number;
    transport: string;
    host: string;
}

const formSchema = z.object({
    username: z
        .string()
        .min(3, { message: "Nazwa użytkownika musi mieć co najmniej 3 znaki" }),
    email: z
        .string()
        .min(1, { message: "Adres email jest wymagany" })
        .email({ message: "Nieprawidłowy adres email" }),
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

export default function SignUp() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [rateLimited, setRateLimited] = useState(false);
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isRouting, startRouting] = useTransition();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/info`)
            const apiResponse: apiResponse = await res.json()
            
            await authClient.signUp.email({
                email: data.email,
                password: data.password,
                name: data.username,
                ipAddress: apiResponse.remoteAdress,
                userAgent: apiResponse.userAgent,
            },
            {
                onSuccess: () => {
                    setSuccess(true);
                    setRateLimited(false);
                    setIsSubmitting(false);
                    startRouting(() => {
                        router.push(`/auth/otp?email=${data.email}`);
                    });
                },
                onError: () => {
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
            });
        } catch (error) {
            console.error("Error signing up:", error);
            setError(true);
            setIsSubmitting(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex flex-col items-center justify-center container mx-auto max-w-md animate-slide-in-bottom">
            <div className="w-full max-w-2xl p-8 relative border border-zinc-800 rounded-lg">
                <div className="flex flex-col items-center justify-center pb-10 animate-fade-in-01-text opacity-0">
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                        Rejestracja
                    </h1>
                    <p className="text-zinc-500 text-md">
                        Utwórz konto, aby rozpocząć
                    </p>
                </div>

                <div className="space-y-6 mb-6 animate-slide-in-left">
                    <Google />
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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative w-full">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-400">Nazwa użytkownika</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field}
                                            className="bg-zinc-950/20 border-zinc-800 backdrop-blur-sm text-zinc-200 placeholder:text-zinc-500"
                                            placeholder="Wprowadź swoją nazwę użytkownika"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-400 animate-fade-in-01-text" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-400">Adres email</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field}
                                            type="email"
                                            className="bg-zinc-950/20 border-zinc-800 backdrop-blur-sm text-zinc-200 placeholder:text-zinc-500"
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
                                    <FormMessage className="text-red-400 animate-fade-in-01-text    " />
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

                        <FormDescription className="text-zinc-500">    
                            Rejestrując się, akceptujesz <Link href="/terms" className="text-zinc-400 hover:text-zinc-300">warunki użytkowania</Link> 
                        </FormDescription>

                        <Button
                            type="submit"
                            className="w-full bg-zinc-900/20 border border-zinc-900 backdrop-blur-sm hover:bg-zinc-800 text-zinc-400 animate-slide-in-left"
                            disabled={isSubmitting || isRouting}
                        >
                            {isSubmitting || isRouting ? (
                                <span className="flex items-center justify-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isRouting ? "Przekierowanie..." : "Tworzenie konta..."}
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Rejestracja
                                </span>
                            )}
                        </Button>

                        {error && (
                            <div className="p-3 border border-dashed border-red-800 text-red-400 rounded-md text-sm animate-fade-in-01-text">
                                Wystąpił błąd podczas rejestracji. Proszę spróbować ponownie.
                            </div>
                        )}
                        {rateLimited && (
                            <div className="p-3 border border-dashed border-red-800 text-red-400 rounded-md text-sm animate-fade-in-01-text">
                                Wykryto podejrzane działania na Twoim koncie. Proszę spróbować ponownie później (429 - Za dużo żądań).
                            </div>
                        )}
                    </form>
                </Form>

                
            </div>
        </main>
    );
}