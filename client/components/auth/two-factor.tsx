"use client";
import { useQueryState } from 'nuqs'
import { useState, useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound, CheckCircle, Terminal } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

type FormData = {
    otp: string;
    rememberDevice?: boolean;
};

const formSchema = z.object({
    otp: z.string().min(6, {
        message: "Kod OTP musi składać się z 6 cyfr",
    }),
    rememberDevice: z.boolean().default(false),
});

export default function TwoFactorComponent() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(false);
    const [remaining, setRemaining] = useState("");
    const [success, setSuccess] = useState(false);
    const [isRouting, startRouting] = useTransition();
    const [token] = useQueryState("token");
    const [email] = useQueryState("email");
    const router = useRouter();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            otp: "",
            rememberDevice: false,
        },
    });

    const { refetch } = useSession();

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/2fa/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    code: data.otp,
                    email: email || "",
                    rememberDevice: data.rememberDevice,
                }),
                credentials: "include",
            });
            if (response.ok) {
                setSuccess(true);
                setIsSubmitting(false);
                toast.info("Weryfikacja powiodła się. Przekierowanie...");
                startRouting(() => {
                    refetch();
                    router.push(`/panel`);
                });
                
            } else {
                setError(true);
                setIsSubmitting(false);
                toast.error("Nieprawidłowy kod weryfikacyjny. Proszę spróbować ponownie.");
                console.log(response.headers.get("RateLimit-Remaining"))
                setRemaining(response.headers.get("RateLimit-Remaining") ?? "");
            }
        } catch (error) {
            console.error("Error verifying 2FA:", error);
            setError(true);
            setIsSubmitting(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex flex-col items-center justify-center container mx-auto max-w-lg px-12 mt-5">
            <div className="w-full max-w-2xl p-8 relative border border-dashed border-zinc-800 backdrop-blur-sm rounded-lg">
                <div className="flex flex-col items-center justify-center pb-6 animate-fade-in-01-text opacity-0">
                    <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                        Dwuetapowa weryfikacja
                    </h1>
                    <p className="text-zinc-500 text-sm text-center">
                        Wprowadź 6-cyfrowy kod weryfikacyjny wysłany na adres <span className="text-zinc-200 font-medium">{email}</span> w celu zweryfikowania osobowości.
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 relative w-full">
                        <FormField
                            control={form.control}
                            name="otp"
                            render={({ field }) => (
                                <FormItem className="flex flex-col items-center">
                                    <FormLabel className="text-zinc-200 animate-fade-in-01-text text-md pb-1">Kod weryfikacyjny</FormLabel>
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

                        <FormField
                            control={form.control}
                            name="rememberDevice"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-y-0 rounded-md border border-dashed border-zinc-800 p-2 bg-zinc-900/20 backdrop-blur-sm  hover:bg-zinc-900/30">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            className="border-zinc-700 data-[state=checked]:bg-zinc-700 data-[state=checked]:border-zinc-600 transition-all duration-100"
                                        />
                                    </FormControl>    
                                    <div className="leading-none">
                                        <FormLabel className="text-xs font-medium text-zinc-200 cursor-pointer flex items-center  hover:text-zinc-100">
                                            Zapamiętaj to urządzenie przez 30 dni
                                        </FormLabel>
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
                                Nieprawidłowy kod weryfikacyjny. 
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
                        <AlertDescription className="text-xs">
                            Sprawdź folder spam w swojej skrzynce pocztowej. Nie zamykaj tej strony. Kod jest ważny przez 10 minut.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </main>
    );
}