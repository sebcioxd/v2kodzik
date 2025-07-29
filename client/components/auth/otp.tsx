"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound, Mail, XCircle, CheckCircle, Terminal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type FormData = {
    otp: string;
};

const formSchema = z.object({
    otp: z.string().min(6, {
        message: "Kod OTP musi składać się z 6 cyfr",
    }),
});

export default function OTPInput() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isRouting, startRouting] = useTransition();
    const router = useRouter();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            otp: "",
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            await authClient.emailOtp.verifyEmail({
                email: email || "",
                otp: data.otp,
            },
            { 
                onSuccess: () => {
                    setSuccess(true);
                    setIsSubmitting(false);
                    startRouting(() => {
                        router.push(`/auth/verify`);
                    });
                },
                onError: () => {
                    setError(true);
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
        <main className="flex flex-col items-center justify-center container mx-auto max-w-sm animate-slide-in-left">
            <div className="w-full max-w-2xl p-8 relative border border-dashed border-zinc-800 backdrop-blur-sm rounded-lg">
                <div className="flex flex-col items-center justify-center pb-6 animate-fade-in-01-text opacity-0">
                    <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                        Weryfikacja kodu
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        Wprowadź 6-cyfrowy kod weryfikacyjny wysłany na adres <span className="text-zinc-200 font-medium">{email}</span>
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 relative w-full"> 
                        <FormField
                            control={form.control}
                            name="otp"
                            render={({ field }) => (
                                <FormItem className="flex flex-col items-center">
                                    <FormLabel className="text-zinc-200 animate-fade-in-01-text text-sm pb-1">Kod weryfikacyjny</FormLabel>
                                    <FormControl>
                                        <InputOTP
                                            maxLength={6}
                                            value={field.value}
                                            onChange={field.onChange}
                                        
                                        >
                                            <InputOTPGroup>
                                                <InputOTPSlot 
                                                    className="bg-transparent border border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 focus:border-zinc-600" 
                                                    index={0}
                                                />
                                                <InputOTPSlot 
                                                    className="bg-transparent border border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 focus:border-zinc-600" 
                                                    index={1}
                                                />
                                                <InputOTPSlot 
                                                    className="bg-transparent border border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 focus:border-zinc-600" 
                                                    index={2}
                                                />
                                            </InputOTPGroup>
                                            <InputOTPSeparator className="text-zinc-400"/>
                                            <InputOTPGroup>
                                                <InputOTPSlot 
                                                    className="bg-transparent border border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 focus:border-zinc-600" 
                                                    index={3}
                                                />
                                                <InputOTPSlot 
                                                    className="bg-transparent border border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 focus:border-zinc-600" 
                                                    index={4}
                                                />
                                                <InputOTPSlot 
                                                    className="bg-transparent border border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 focus:border-zinc-600" 
                                                    index={5}
                                                />
                                            </InputOTPGroup>
                                        </InputOTP>
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
                                    {isRouting ? "Przekierowanie..." : "Weryfikacja..."}
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Zweryfikuj kod
                                </span>
                            )}
                        </Button>

                        {error && (
                            <div className="p-3 border border-dashed border-red-800 text-red-400 rounded-md text-sm animate-fade-in-01-text flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                Nieprawidłowy kod weryfikacyjny. Proszę spróbować ponownie.
                            </div>
                        )}
                        {success && (
                            <div className="p-3 border border-dashed border-green-800 text-green-400 rounded-md text-sm animate-fade-in-01-text flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Weryfikacja powiodła się. Przekierowanie...
                            </div>
                        )}
                    </form>
                </Form>

                <div className="mt-6">
                    <Alert className="bg-zinc-900/20 border-dashed border-zinc-800 text-zinc-400">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle className="text-sm">Nie otrzymałeś kodu?</AlertTitle>
                        <AlertDescription className="text-sm">
                            Sprawdź folder spam w swojej skrzynce pocztowej
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </main>
    );
}
