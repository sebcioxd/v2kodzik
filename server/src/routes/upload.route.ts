import type { UploadRequestProps, AuthSession } from "../lib/types.ts";
import type { Context } from "hono";
import { shares, uploadedFiles } from "../db/schema.js";
import { rateLimiterService } from "../services/rate-limit.service.js";
import { S3UploadService } from "../services/upload.service.js";
import { fixRequestProps } from "../utils/req-fixer.js";
import { hashCode } from "../lib/hash.js";
import { Hono } from "hono";
import { db } from "../db/index.js";

const disallowedCharacters = /[(){}[\]!@#$%^&*+=\\|<>?,;:'"]/;

const uploadRoute = new Hono<AuthSession>();

uploadRoute.post("/", async (c: Context) => {
    
    const user = c.get("user");

    const { slug, isPrivate, accessCode, visibility, time } = c.req.query() as unknown as UploadRequestProps;

    const result = await fixRequestProps({ slug, isPrivate, accessCode, visibility, time }, c, user);

    if (result instanceof Response) {
        return result;
    }

    const req: UploadRequestProps = result;

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

    const formData = await c.req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
        return c.json({
            message: "Nie przesłano żadnych plików.",
        }, 400)
    }

    if (files.some(file => disallowedCharacters.test(file.name))) {
        return c.json({
            message: "Nazwa pliku zawiera niedozwolone znaki.",
        }, 400)
    }

    try {
        await Promise.all(files.map(async (file) => {

            const buffer = await file.arrayBuffer();

            const uploadService = await S3UploadService({
                Key: `${req.slug}/${file.name}`,
                Body: new Uint8Array(buffer),
            });

            if (!uploadService) {
                return c.json({
                    message: "Błąd podczas przesyłania plików. Kod błędu: S3_UPLOAD_MISMATCH",
                }, 500)
            }

            return uploadService;
        }));
    } catch (error) {
        return c.json({
            message: "Błąd podczas przesyłania plików. Kod błędu: S3_UPLOAD_ERROR",
            error: error
        }, 500)
    }

    const shareResult = await db.insert(shares).values({
        slug: req.slug,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + (req.time === "24" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)), 
        userId: user ? user.id : null,
        private: req.isPrivate === "true",
        code: req.accessCode ? await hashCode(req.accessCode) : null,
        visibility: visibility === "true",
        ipAddress: c.req.header("x-forwarded-for") || null,
        userAgent: c.req.header("user-agent") || null,
    }).returning({ id: shares.id });

    await Promise.all(files.map(async (file) => {
        await db.insert(uploadedFiles).values({
            shareId: shareResult[0].id,
            fileName: file.name,
            size: file.size,
            storagePath: `${req.slug}/${file.name}`,
        })
    }))

    return c.json({
        message: "Files uploaded successfully",
        slug: req.slug,
        time: req.time,
    }, 200)
       
});

export default uploadRoute;