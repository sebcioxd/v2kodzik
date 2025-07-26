"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Turnstile as TurnstileWidget } from '@marsidev/react-turnstile';
import { toast } from "sonner";

export interface TurnstileRef {
  reset: () => void;
}

interface TurnstileProps {
  onTokenChange: (token: string | null) => void;
}

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
  ({ onTokenChange }, ref) => {
    const [token, setToken] = useState<string | null>(null);
    const widgetRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetRef.current) {
          widgetRef.current.reset();
        }
        setToken(null);
        onTokenChange(null);
      }
    }));

    const handleSuccess = (token: string) => {
      setToken(token);
      onTokenChange(token);
    };

    const handleError = () => {
      setToken(null);
      onTokenChange(null);
      toast.error("Nie udało się zweryfikować captchy.");
    };

    const handleExpire = () => {
      setToken(null);
      onTokenChange(null);
      toast.error("Captcha wygasła, spróbuj ponownie.");
      if (widgetRef.current) {
        widgetRef.current.reset();
      }
    };

    return (
      <div className="w-full flex justify-center mb-4">
        <div className="p-2 rounded-lg  backdrop-blur-sm hover:border-zinc-700 transition-all duration-300">
          <TurnstileWidget
            ref={widgetRef}
            siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
            onSuccess={handleSuccess}
            onError={handleError}
            onExpire={handleExpire}
            options={{
              theme: 'dark',
              language: 'pl',
              refreshExpired: "auto",
              size: 'normal',
            }}
          />
        </div>
      </div>
    );
  }
);

Turnstile.displayName = "Turnstile";