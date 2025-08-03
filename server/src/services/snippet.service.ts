import type { CreateSnippetServiceProps, GetSnippetServiceProps } from "../lib/types";
import { snippets } from "../db/schema";
import { db } from "../db/index";
import { eq, desc, sql } from "drizzle-orm";
import type { Context } from "hono";
import { restrictedPaths } from "../utils/req-fixer";

const disallowedCharacters = /[(){}[\]!@#$%^&*+=\\|<>?,;:'"]/;

const reqFixer = ({ slug, time, code, language, c }: { slug: string, time: string, code: string, language: string, c: Context }) => {
    if (!time || !code || !language) {
        return c.json({
            message: "Nieprawidłowe dane",
        }, 400);
    }

    if (!slug || slug.length === 0) {
        slug = Math.random().toString(36).substring(2, 8);
    }

    if (slug.length < 3 || slug.length > 16) {
        return c.json({
            message: "Link musi mieć długość między 3 a 16 znaków.",
        }, 400);
    }

    if (disallowedCharacters.test(slug)) {
        return c.json({
            message: "Link zawiera niedozwolone znaki.",
        }, 400);
    }

    if (restrictedPaths.includes(slug)) {
        return c.json({
            message: "Link nie może być użyty. Narusza on nasze zasady routingowe.",
        }, 400);
    }

    if (time !== "24" && time !== "168" && time !== "30") {
        return c.json({
            message: "Nieprawidłowa wartość czasu.",
        }, 400);
    }

    return { slug, time, code, language };
}


export async function createSnippetService({ c, user }: CreateSnippetServiceProps) {
    const { slug, code, language, time } = await c.req.json();
    const userId = user?.id;

    const req = reqFixer({ slug, time, code, language, c });

    if (req instanceof Response) {
        return req;
    }

    const existingSnippet = await db.select().from(snippets).where(eq(snippets.slug, req.slug));

    if (existingSnippet.length > 0) {
        return c.json({
            message: "Schowek o podanym slug już istnieje.",
        }, 400);
    }

    const snippet = await db.insert(snippets).values({
        slug: req.slug,
        ipAddress: c.req.header("x-forwarded-for") || null,
        userAgent: c.req.header("user-agent") || null,
        expiresAt: sql.raw(`NOW() + INTERVAL '${req.time === "24" ? "24 hours" : req.time === "168" ? "168 hours" : "30 minutes"}'`),
        code: req.code,
        language: req.language,
        userId: userId,
    }).returning({ slug: snippets.slug });

    return c.json({
        message: "Pomyślnie utworzono schowek.",
        slug: snippet[0].slug,
    }, 200);
}

export async function getSnippetService({ c, slug }: GetSnippetServiceProps) {

    const [snippet] = await db.select().from(snippets).where(eq(snippets.slug, slug));

    if (!snippet) {
        return c.json({
            message: "Schowek o podanym slug nie istnieje.",
        }, 404);
    }

    return c.json({
        message: "Pomyślnie pobrano schowek.",
        snippet: snippet,
    }, 200);
}

