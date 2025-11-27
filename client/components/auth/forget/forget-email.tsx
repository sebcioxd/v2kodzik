"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Send, Loader2 } from "lucide-react";
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
            await authClient.requestPasswordReset({
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
            console.error("Error sending email:", error);
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
                        Zapomniałeś hasła?
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        Wprowadź swój adres email, aby otrzymać link do zmiany hasła.
                    </p>
                </div>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 relative w-full">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-200 animate-fade-in-01-text text-sm pb-1">
                                        Adres e-mail twojego konta
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

                        <Button
                            type="submit"
                            className="w-full bg-zinc-900 backdrop-blur-sm border border-dashed border-zinc-800 hover:bg-zinc-800 duration-50 text-zinc-300"
                            disabled={isSubmitting || isRouting}
                            size="sm"
                        >
                            {isSubmitting || isRouting ? (
                                <span className="flex items-center justify-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isRouting ? "Przekierowanie..." : "Wysyłanie..."}
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <Send className="mr-2 h-4 w-4" />
                                    Wyślij e-mail resetujący
                                </span>
                            )}
                        </Button>

                        <div className="text-center">
                            <Link href="/auth" className="text-zinc-500 hover:text-zinc-400 text-sm">
                                Wróć do logowania
                            </Link>
                        </div>

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