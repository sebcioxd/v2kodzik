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
        const [presignedData, shareResult] = await Promise.all([
            Promise.all(files.map(file => 
                S3UploadService({
                    Key: `${req.slug}/${file.name}`,
                })
            )),
            db.insert(shares).values({
                slug: req.slug,
                createdAt: new Date(),
                updatedAt: new Date(),
                expiresAt: new Date(Date.now() + (req.time === "24" ? 24 * 60 * 60 * 1000 : req.time === "168" ? 7 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000)), 
                userId: user ? user.id : null,
                private: req.isPrivate === "true",
                code: req.accessCode ? await hashCode(req.accessCode) : null,
                visibility: visibility === "true",
                ipAddress: c.req.header("x-forwarded-for") || null,
                userAgent: c.req.header("user-agent") || null,
            }).returning({ id: shares.id })
        ]);
        const formattedPresignedData = presignedData.map((data, index) => ({
            fileName: files[index].name,
            ...data
        }));

        await db.insert(uploadedFiles).values(
            files.map(file => ({
                shareId: shareResult[0].id,
                fileName: file.name,
                size: file.size,
                storagePath: `${req.slug}/${file.name}`,
            }))
        );

        return c.json({
            message: "Pliki zostały przesłane pomyślnie",
            slug: req.slug,
            time: req.time,
            presignedData: formattedPresignedData
        }, 200);

    } catch (error) {
        return c.json({
            message: "Wystąpił błąd podczas przesyłania plików",
            error: error
        }, 500);
    }
});

export default uploadRoute;