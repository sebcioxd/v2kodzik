import type { UploadRequestProps, User } from "../lib/types.js";
import type { Context } from "hono";
import { db } from "../db/index.js";
import { shares } from "../db/schema.js";
import { eq } from "drizzle-orm";


const restrictedPaths = ["/upload", "/search", "/faq", "/api", "/admin", "/auth", "/panel", "/success"];

export async function fixRequestProps(req: UploadRequestProps, c: Context, user?: typeof User): Promise<UploadRequestProps | Response> {    

    if (req.isPrivate.length === 0 || req.visibility.length === 0 || req.time.length === 0) {
        return c.json({
            message: "Brakuje wymaganych pól",
            receivedFields: {
                isPrivate: req.isPrivate,
                accessCode: req.accessCode,
                visibility: req.visibility,
                time: req.time
            }
        }, 400)
    }

    if (req.isPrivate === "true" && req.accessCode.length === 0) {
        return c.json({
            message: "Kod dostępu jest wymagany gdy piki są prywatne.",
            receivedFields: {
                isPrivate: req.isPrivate,
                accessCode: req.accessCode
            }
        }, 400)
    }
    

    if (restrictedPaths.includes(req.slug)) {
        return c.json({
            message: "Link nie może być użyty. Narusza on nasze zasady routingowe.",
            receivedSlug: req.slug
        }, 400)
    }
    
    if (!req.slug) {
        req.slug = Math.random().toString(36).substring(2, 8);
    }

    if (req.slug.length < 4 || req.slug.length > 16) {
        return c.json({
            message: "Link musi mieć długość między 4 a 16 znaków.",
            receivedSlug: req.slug
        }, 400)
    }

    if (req.time !== "24" && req.time !== "168" && req.time !== "0.5") {
        return c.json({
            message: "Nieprawidłowy czas. Musi być albo 24 godziny (1 dzień) albo 7 dni (168 godzin) albo 30 minut (0.5).",
            receivedTime: req.time
        }, 400)
    }

    if (req.time === "168" && !user) {
        return c.json({
            message: "Musisz być zalogowany aby utworzyć udostępnienie na 7 dni.",
            receivedTime: req.time,
            receivedUser: user
        }, 400)
    }

    if (req.isPrivate === "true" && !req.accessCode) {
        return c.json({
            message: "Kod dostępu jest wymagany gdy piki są prywatne.",
            receivedFields: {
                isPrivate: req.isPrivate,
                accessCode: req.accessCode
            }
        }, 400)
    }

    const checkForShare = await db.select().from(shares).where(eq(shares.slug, req.slug));

    if (checkForShare.length > 0) {
        return c.json({
            message: "Link już jest zajęty. Spróbuj inny.",
            receivedSlug: req.slug
        }, 400)
    }

    return req;
    
}
