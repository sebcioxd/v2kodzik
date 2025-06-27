import type { UploadRequestProps, AuthSession } from "../lib/types.ts";
import type { Context } from "hono";
import { shares, uploadedFiles } from "../db/schema.js";
import { rateLimiterService } from "../services/rate-limit.service.js";
import { S3UploadService } from "../services/upload.service.js";
import { fixRequestProps } from "../utils/req-fixer.js";
import { hashCode } from "../lib/hash.js";
import { Hono } from "hono";
import { db } from "../db/index.js";
import { eq } from "drizzle-orm";
const disallowedCharacters = /[(){}[\]!@#$%^&*+=\\|<>?,;:'"]/;

const uploadRoute = new Hono<AuthSession>();

uploadRoute.post("/presign", async (c: Context) => {
    const user = c.get("user");
    const { slug, isPrivate, accessCode, visibility, time } = c.req.query() as unknown as UploadRequestProps;
    const fileNames = c.req.query("fileNames")?.split(",");

    const result = await fixRequestProps({ slug, isPrivate, accessCode, visibility, time }, c, user);

    if (result instanceof Response) {
        return result;
    }

    const req: UploadRequestProps = result;

    if (!fileNames || fileNames.length === 0) {
        return c.json({
            message: "Nie podano nazw plików",
        }, 400);
    }

    try {
        await rateLimiterService({
            keyPrefix: "upload",
            identifier: c.req.header("x-forwarded-for") || "127.0.0.1",
        });
    } catch (error) {
        return c.json({
            message: "Przekroczono limit żądań. Spróbuj ponownie później.",
            error: error
        }, 429)
    }

    if (fileNames.some(name => disallowedCharacters.test(name))) {
        return c.json({
            message: "Nazwa pliku zawiera niedozwolone znaki.",
        }, 400);
    }

    try {
        const presignedData = await Promise.all(fileNames.map(async (fileName) => {
            const uploadService = await S3UploadService({
                Key: `${req.slug}/${fileName}`,
            });

            return {
                fileName,
                ...uploadService
            };
        }));

        const shareResult = await db.insert(shares).values({
            slug: req.slug,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + (req.time === "24" ? 24 * 60 * 60 * 1000 : req.time === "168" ? 7 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000)), 
            userId: user ? user.id : null,
            private: req.isPrivate === "true",
            code: req.accessCode ? await hashCode(req.accessCode) : null,
            visibility: req.visibility === "true",
            ipAddress: c.req.header("x-forwarded-for") || null,
            userAgent: c.req.header("user-agent") || null,
        }).returning({ id: shares.id });

        return c.json({
            presignedData,
            slug: req.slug,
            time: req.time,
            shareId: shareResult[0].id
        });

    } catch (error) {
        return c.json({
            message: "Error generating presigned URLs",
            error
        }, 500);
    }
});


uploadRoute.post("/finalize", async (c: Context) => {
    const { 
        shareId,
        slug,  
        files 
    } = await c.req.json();

    try {
        await Promise.all(files.map(async (file: { fileName: string; size: number }) => {
            await db.insert(uploadedFiles).values({
                shareId: shareId,
                fileName: file.fileName,
                size: file.size,
                storagePath: `${slug}/${file.fileName}`, 
            })
        }));

        return c.json({
            message: "Pliki zostały wysłane pomyślnie"
        });

    } catch (error) {
        await db.delete(shares).where(eq(shares.id, shareId));
        
        return c.json({
            message: "Wystąpił błąd podczas wysyłania plików",
            error
        }, 500);
    }
});

export default uploadRoute;