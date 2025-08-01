import type { Context } from "hono";
import type { z } from "zod";
import { uploadQuerySchema } from "../lib/zod";
import { db } from "../db/index";
import { shares } from "../db/schema";
import { eq } from "drizzle-orm";

export const restrictedPaths = ["upload", "search", "faq", "api", "admin", "auth", "panel", "success", "schowek", "terms", "oauth-password", "pricing"];
const disallowedCharacters = /[(){}[\]!@#$%^&*+=\\|<>?,;:'"]/;

type ValidatedUploadRequest = z.infer<typeof uploadQuerySchema>;

export async function fixRequestProps(
    req: ValidatedUploadRequest, 
    c: Context, 
    user?: any | null
): Promise<ValidatedUploadRequest | Response> {    
    
    
    if (req.isPrivate && (!req.accessCode || req.accessCode === '')) {
        return c.json({
            message: "Kod dostępu jest wymagany gdy pliki są prywatne.",
            receivedFields: {
                isPrivate: req.isPrivate,
                accessCode: req.accessCode
            }
        }, 400);
    }

    if (!req.fileNames || req.fileNames.length === 0) {
        return c.json({
            message: "Nie podano nazw plików",
        }, 400);
    }

    if (req.fileNames.some(name => disallowedCharacters.test(name))) {
        return c.json({
            message: "Nazwa pliku zawiera niedozwolone znaki.",
        }, 400);
    }

    if (restrictedPaths.includes(req.slug || "")) {
        return c.json({
            message: "Link nie może być użyty. Narusza on nasze zasady routingowe.",
            receivedSlug: req.slug
        }, 400);
    }

    if (!req.slug) {
        req.slug = Math.random().toString(36).substring(2, 8);
    }

    if (req.slug.length < 4 || req.slug.length > 16) {
        return c.json({
            message: "Link musi mieć długość między 4 a 16 znaków.",
            receivedSlug: req.slug
        }, 400);
    }

    if (req.time !== "24" && req.time !== "168" && req.time !== "0.5") {
        return c.json({
            message: "Nieprawidłowy czas. Musi być albo 24 godziny (1 dzień) albo 7 dni (168 godzin) albo 30 minut (0.5).",
            receivedTime: req.time
        }, 400);
    }

    if (req.time === "168" && !user) {
        return c.json({
            message: "Musisz być zalogowany aby utworzyć udostępnienie na 7 dni.",
            receivedTime: req.time,
            receivedUser: user
        }, 400);
    }

    const checkForShare = await db.select().from(shares).where(eq(shares.slug, req.slug));
    if (checkForShare.length > 0) {
        return c.json({
            message: "Link już jest zajęty. Spróbuj inny.",
            receivedSlug: req.slug
        }, 400);
    }

    return req;
}
