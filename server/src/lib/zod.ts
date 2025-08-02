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

export const finalizeSchema = z.object({
    slug: z.string().min(1, "Slug jest wymagany"),
    files: z.array(z.object({
        fileName: z.string().min(1, "Nazwa pliku jest wymagana"),
        size: z.number().min(1, "Rozmiar pliku jest wymagany"),
        contentType: z.string().min(0, "Typ pliku jest wymagany"),
        lastModified: z.number().min(1, "Data modyfikacji jest wymagana"),
    })),
    isPrivate: z.boolean(),
    visibility: z.boolean(),
    accessCode: z.string().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
    time: z.number().min(0.5, "Czas jest wymagany").max(168, "Czas jest zbyt duży"),
    signature: z.string().min(1, "Podpis jest wymagany"),
    cancel_signature: z.string().min(1, "Podpis anulowania jest wymagany"),
});

export const uploadBodySchema = z.object({
    token: z.string().min(1, "Turnstile token jest wymagany"),
    fileSizes: z.array(z.number()).optional()
});

export const cancelBodySchema = z.object({
    cancel_signature: z.string().min(1, "Podpis anulowania jest wymagany"),
})