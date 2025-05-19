"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
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
};

const formSchema = z.object({
    email: z
        .string()
        .min(1, { message: "Adres email jest wymagany" })
        .email({ message: "Nieprawidłowy adres email" }),
});

export default function ForgetEmail() {
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
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            await authClient.forgetPassword({
                email: data.email,
                redirectTo: "/auth/forget/password",
            },
            {
                onSuccess: () => {
                    setSuccess(true);
                    setRateLimited(false);
                    setIsSubmitting(false);
                    startRouting(() => {  
                        router.push("/auth/forget/success?email=" + data.email);
                        refetch()
                    });
                },
                onError: () => {
                    setError(true);
                    setRateLimited(false);
                    setIsSubmitting(false);
                }
            }
        );
        } catch (error) {
            console.error("Error sending email:", error);
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
                    <h1 className="text-2xl text-zinc-100">Zapomniałeś hasła?</h1>
                    <p className="text-zinc-500 text-md">
                        Wprowadź swój adres email, aby otrzymać link do zmiany hasła.
                    </p>
                </div>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative w-full">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-400">Adres e-mail twojego konta</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field}
                                            type="email"
                                            className="bg-zinc-950/20 border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 placeholder:text-zinc-500"
                                            placeholder="twój.email@przykład.com"
                                        />
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
                                     {isRouting ? "Przekierowanie..." : "Wysyłanie..."}
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <Send className="mr-2 h-4 w-4" />
                                    Wyślij e-mail resetujący
                                </span>
                            )}
                        </Button>

                        <Link href="/auth" className="text-zinc-500 hover:text-zinc-400">
                            Wróć do logowania
                        </Link>

                        {error && (
                            <div className="p-3 border border-dashed border-red-800 text-red-400 rounded-md text-sm animate-fade-in-01-text">
                                Nieprawidłowy adres email. Proszę spróbować ponownie.
                            </div>
                        )}
                        {rateLimited && (
                            <div className="p-3 border border-dashed border-red-800 text-red-400 rounded-md text-sm animate-fade-in-01-text">
                                Wykryto podejrzane działania na Twoim koncie. Proszę spróbować ponownie później (429 - Za dużo żądań).
                            </div>
                        )}
                        {success && (
                            <div className="p-3 border border-dashed border-green-800 text-green-400 rounded-md text-sm animate-fade-in-01-text">
                                E-mail z linkiem do zmiany hasła został wysłany.
                            </div>
                        )}
                    </form>
                </Form>
            </div>
        </main>
    );
}