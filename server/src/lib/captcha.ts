import type { Context } from "hono";
import { CLOUDFLARE_TURNSTILE_SECRET_KEY } from "./env";

export async function verifyCaptcha({ c, token }: { c: Context; token: string }) {
    const ipAddress = c.req.header("CF-Connecting-IP");
    const formData = new FormData();
    formData.append("secret", CLOUDFLARE_TURNSTILE_SECRET_KEY);
    formData.append("response", token);
    formData.append("remoteip", ipAddress || "");
    
    const cfResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData
    });
    
    const cfOutcome = await cfResponse.json();
    if (!cfOutcome.success) {
        throw new Error(getErrorMessage(cfOutcome['error-codes']));
    }
}

function getErrorMessage(errorCodes: string[]): string {
    const errorMessages: { [key: string]: string } = {
        'missing-input-secret': 'Brak klucza tajnego.',
        'invalid-input-secret': 'Nieprawidłowy klucz tajny.',
        'missing-input-response': 'Brak tokenu odpowiedzi.',
        'invalid-input-response': 'Nieprawidłowy token odpowiedzi.',
        'bad-request': 'Nieprawidłowe żądanie.',
        'timeout-or-duplicate': 'Token wygasł lub został już użyty. Odśwież stronę.',
        'internal-error': 'Błąd wewnętrzny serwera Turnstile.'
    };
    return errorCodes
        .map(code => errorMessages[code] || `Nieznany błąd: ${code}`)
        .join(', ');
}

