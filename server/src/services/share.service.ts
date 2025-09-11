import type { GetShareFileServiceProps, VerifyShareCodeServiceProps, VerifyCookieServiceProps } from "../lib/types";
import { db } from "../db/index";
import { shares, uploadedFiles, sharesHistory } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyCode } from "../lib/hash";
import { ENVIRONMENT } from "../lib/env";
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { DOMAIN_WILDCARD } from "../lib/env";

const getFiles = async (shareId: string) => {
    const [files] = await Promise.all([
        db.select().from(uploadedFiles).where(eq(uploadedFiles.shareId, shareId)),
        db.update(shares).set({ views: sql`${shares.views} + 1` }).where(eq(shares.id, shareId)),
        db.update(sharesHistory).set({ views: sql`${sharesHistory.views} + 1` }).where(eq(sharesHistory.id, shareId))
    ]);
    return files;
}

export async function getShareFileService({ slug, c, user }: GetShareFileServiceProps) {

    const [share] = await db.select().from(shares).where(eq(shares.slug, slug));

    if (!share) {
        return c.json({
            message: "Nie znaleziono udostępnienia",
        }, 404)
    }

    if (share.private && share.userId !== user?.id) {
        return c.json({
            id: share.id,
            slug: share.slug,
            createdAt: share.createdAt,
            expiresAt: share.expiresAt,
            private: true,
            views: share.views,
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
        views: share.views,
        storagePath: files[0].storagePath,
        files: files,
        totalSize: files.reduce((acc, file) => acc + file.size, 0),
        private: false,
        autoVerified: share.userId === user?.id,
        autoVerifiedPrivateStatus: share.private
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
            message: "Kod jest nieprawidłowy",
        }, 403)
    }

    setCookie(c, `share_${share.id}`, code || "", {
        path: "/",
        httpOnly: true,
        domain: ENVIRONMENT === "production" ? DOMAIN_WILDCARD : undefined,
        secure: ENVIRONMENT === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 3 // 3 godziny
      })

    const files = await getFiles(share.id);

    return c.json({
        success: true,
        files: files,
        totalSize: files.reduce((acc, file) => acc + file.size, 0),
        storagePath: files[0].storagePath,
        views: share.views,
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

    const isCodeValid = await verifyCode(cookie, idToSlug.code || ""); 

    if (!isCodeValid) {
        deleteCookie(c, `share_${idToSlug.id}`, {
            path: "/",
            domain: ENVIRONMENT === "production" ? DOMAIN_WILDCARD : undefined,
            secure: ENVIRONMENT === "production",
        });
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
        views: idToSlug.views,
      }, 200);
}
