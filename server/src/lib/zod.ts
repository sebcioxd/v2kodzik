import { z } from 'zod';

export const uploadQuerySchema = z.object({
    slug: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
    fileNames: z.string().min(1, "Nazwy plików są wymagane").transform(val => val.split(',')),
    contentTypes: z.string().min(0, "Typy plików są wymagane. Ten błąd może wystąpić gdy plik jest nieobsługiwanego formatu.").transform(val => val.split(',')),
    isPrivate: z.string().transform(val => val === 'true'),
    accessCode: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
    visibility: z.string().min(1, "Widoczność jest wymagana"),
    time: z.string().min(1, "Czas jest wymagany"),
});

export const uploadBodySchema = z.object({
    token: z.string().min(1, "Turnstile token jest wymagany"),
});