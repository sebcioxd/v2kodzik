import type { GetShareFileServiceProps, VerifyShareCodeServiceProps, VerifyCookieServiceProps } from "../lib/types.js";
import { db } from "../db/index.js";
import { shares, uploadedFiles } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { verifyCode } from "../lib/hash.js";
import { ENVIRONMENT } from "../lib/env.js";
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { DOMAIN_WILDCARD } from "../lib/env.js";

const getFiles = async (shareId: string) => {
    const files = await db
        .select()
        .from(uploadedFiles)
        .where(eq(uploadedFiles.shareId, shareId));
    return files;
}

export async function getShareFileService({ slug, c }: GetShareFileServiceProps) {

    const [share] = await db.select().from(shares).where(eq(shares.slug, slug));

    if (!share) {
        return c.json({
            message: "Nie znaleziono udostępnienia",
        }, 404)
    }

    if (share.private) {
        return c.json({
            id: share.id,
            slug: share.slug,
            createdAt: share.createdAt,
            expiresAt: share.expiresAt,
            private: true,
        })
    }

    const files = await getFiles(share.id);

    if (!files || files.length === 0) {
        return c.json({
            message: "Nie znaleziono plików",
        }, 404)
    }

    return c.json({
        id: share.id,
        slug: share.slug,
        createdAt: share.createdAt,
        updatedAt: share.updatedAt,
        expiresAt: share.expiresAt,
        storagePath: files[0].storagePath,
        files: files,
        totalSize: files.reduce((acc, file) => acc + file.size, 0),
        private: false
    })

}

export async function verifyShareCodeService({ code, slug, c }: VerifyShareCodeServiceProps) {
    if (!code || !slug) {
        return c.json({
            message: "Nieprawidłowe dane. Brakuje kodu lub linku.",
        }, 400)
    }

    const [share] = await db.select().from(shares).where(eq(shares.slug, slug));

    if (!share) {
        return c.json({
            message: "Nie znaleziono udostępnienia",
        }, 404)
    }

    const isCodeValid = await verifyCode(code, share.code || "");

    if (!isCodeValid) {
        return c.json({
            message: "Kodj jest nieprawidłowy",
        }, 403)
    }

    setCookie(c, `share_${share.id}`, code || "", {
        path: "/",
        httpOnly: true,
        domain: ENVIRONMENT === "production" ? DOMAIN_WILDCARD : undefined,
        secure: ENVIRONMENT === "production",
        sameSite: "lax",
        maxAge: 60 * 30 // 30 minutes
      })

    const files = await getFiles(share.id);

    return c.json({
        success: true,
        files: files,
        totalSize: files.reduce((acc, file) => acc + file.size, 0),
        storagePath: files[0].storagePath,
    }, 200)

}

export async function verifyCookieService({ slug, c }: VerifyCookieServiceProps) {
    const [idToSlug] = await db.select().from(shares).where(eq(shares.slug, slug));

    if (!idToSlug) {
        return c.json({
            message: "Nie znaleziono udostępnienia",
            success: false,
        }, 404)
    }
 
    const cookie = getCookie(c, `share_${idToSlug.id}`);

    if (!cookie) {
        return c.json({
            message: "Nieprawidłowy cookie",
            success: false,
        }, 403)
    }

    const isCodeValid = await verifyCode(cookie, idToSlug.code || "");  // Add 'await' here

    if (!isCodeValid) {
        deleteCookie(c, `share_${idToSlug.id}`);
        return c.json({
            message: "Nieprawidłowy cookie",
            success: false,
        }, 403)
    }

    const files = await getFiles(idToSlug.id);

    return c.json({ 
        success: true,
        files: files,
        totalSize: files.reduce((acc, file) => acc + (file.size || 0), 0),
        storagePath: files[0].storagePath,
      }, 200);
}
