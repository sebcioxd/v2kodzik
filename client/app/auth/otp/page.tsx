import OTPInput from "@/components/auth/otp"
import { Suspense } from "react";

export default function OtpPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center container mx-auto lg:px-40 md:px-30 px-10 mt-5">
                <div className="text-center space-y-4">
                    <div className="h-8 w-8 animate-spin mx-auto text-zinc-400 border-2 border-zinc-400 border-t-transparent rounded-full" />
                    <h1 className="text-xl font-medium text-zinc-200">
                        Ładowanie...
                    </h1>
                    <p className="text-zinc-400">Prosimy o chwilkę...</p>
                </div>
            </div>
        }>
            <OTPInput />
        </Suspense>
    )
}
