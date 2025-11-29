"use client";

import { useRef, useState } from "react";
import { set, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Eye, EyeOff, Loader2, User, Mail, Lock } from "lucide-react";
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
import Discord from "./discord";
import { toast } from "sonner";

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
    const [isMultiAccountBanned, setIsMultiAccountBanned] = useState(false)
   
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
                oauth: false,
                twofactorEnabled: true,
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
                onError: (ctx) => {
                    if (ctx.response.status !== 429 && ctx.response.status !== 403) {
                        setError(true);
                        setRateLimited(false);
                        setIsSubmitting(false);
                        setIsMultiAccountBanned(false)
                    }
                    if (ctx.response.status === 403) {
                        setIsMultiAccountBanned(true)
                        setRateLimited(false)
                        setIsSubmitting(false)
                    } else {
                        setRateLimited(true);
                        setError(false)
                        setIsSubmitting(false);
                        setIsMultiAccountBanned(false)               
                    }
                       
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
        <main className="flex flex-col items-center justify-center container mx-auto max-w-[26rem] animate-slide-in-left">
            <div className="w-full max-w-2xl p-8 relative border border-dashed border-zinc-800 backdrop-blur-sm rounded-lg">
                <div className="flex flex-col items-center justify-center pb-6 animate-fade-in-01-text opacity-0">
                    <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                        Rejestracja
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        Utwórz konto, aby rozpocząć
                    </p>
                </div>

                <div className="space-y-4 mb-6 animate-slide-in-left flex flex-col  items-center justify-center">
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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 relative w-full">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-200 animate-fade-in-01-text text-sm pb-1">
                                        Nazwa użytkownika
                                    </FormLabel>
                                    <FormControl>
                                        <div className="w-full">
                                            <div className="flex items-center w-full backdrop-blur-sm border border-dashed border-zinc-800 rounded-sm overflow-hidden group transition-all duration-300 hover:bg-zinc-800/50">
                                                <Input 
                                                    {...field}
                                                    className="flex-1 border-0 bg-transparent text-zinc-200 text-sm placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                                                    placeholder="Wprowadź swoją nazwę użytkownika"
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
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-zinc-200 animate-fade-in-01-text text-sm pb-1">
                                        Potwierdź hasło
                                    </FormLabel>
                                    <FormControl>
                                        <div className="w-full">
                                            <div className="flex items-center w-full backdrop-blur-sm border border-dashed border-zinc-800 rounded-sm overflow-hidden group transition-all duration-300 hover:bg-zinc-800/50">
                                                <Input 
                                                    {...field}
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    className="flex-1 border-0 bg-transparent text-zinc-200 text-sm placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                                                    placeholder="Potwierdź swoje hasło"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="px-3 text-zinc-500 hover:text-zinc-400 transition-colors"
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
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
                            className={`w-full bg-zinc-900 backdrop-blur-sm border border-dashed border-zinc-800 hover:bg-zinc-800 duration-50 text-zinc-300`}
                            disabled={isSubmitting || isRouting}
                            size="sm"
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
                                Wykryto podejrzane działania na Twoim koncie. Proszę spróbować ponownie później.
                            </div>
                        )}
                        {isMultiAccountBanned && (
                            <div className="p-3 border border-dashed border-red-800 text-red-400 rounded-md text-sm animate-fade-in-01-text">
                                Wykryliśmy, że przekroczyłeś limit założonych kont w naszym serwisie.
                            </div>
                        )}
                    </form>
                </Form>
            </div>
        </main>
    );
}