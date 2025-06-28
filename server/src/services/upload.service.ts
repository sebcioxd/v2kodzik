import type { FinalizeUploadServiceProps, generatePresignedUrlProps, S3UploadServiceProps, UploadRequestProps } from "../lib/types.js";
import { fixRequestProps } from "../utils/req-fixer.js";
import { shares, uploadedFiles, user } from "../db/schema.js";
import { hashCode } from "../lib/hash.js";
import { db } from "../db/index.js";
import { eq } from "drizzle-orm";
import getS3Client from "../lib/s3.js";

// Funkcja, która generuje presigned URL dla plików do wysyłki.
export async function generatePresignedUrl({ Key }: generatePresignedUrlProps) {
    const client = getS3Client({ bucket: "sharesbucket" });

    const { url, fields } = await client.presignedPostObject(Key, {
        expirySeconds: 200, // 200 sekund
        fields: {
            "Content-Type": "application/octet-stream",
        }
    });

    return { url, fields };
}

// Funkcja, która generuje presigned URL dla plików do wysyłki, oraz tworzy nowy udostępniony link.
// Wszystkie dane są pobierane z requestu, oraz są walidowane i zapisywane do bazy danych.
// Nie jest to ostateczna funkcja, która tworzy udostępniony link, ale tylko generuje presigned URL dla plików do wysyłki.
   
export async function S3UploadService({ c, user }: S3UploadServiceProps) {
    try {
        const { slug, isPrivate, accessCode, visibility, time } = c.req.query();
        const fileNames = c.req.query("fileNames")?.split(",");

        const result = await fixRequestProps({ slug, isPrivate, accessCode, visibility, time, fileNames: fileNames || [] }, c, user);

        if (result instanceof Response) {
            return result;
        }

        const req: UploadRequestProps = result;

        const presignedData = await Promise.all(req.fileNames.map(async (fileName) => {
            const uploadService = await generatePresignedUrl({
                Key: `${req.slug}/${fileName}`,
            });

            return {
                fileName,
                ...uploadService
            };
        }));

        // Zwracamy tylko presigned URLs bez tworzenia wpisu w bazie
        return c.json({
            presignedData,
            slug: req.slug,
            time: req.time
        });

    } catch (error) {
        return c.json({
            message: "Błąd podczas generowania presigned URL",
            error
        }, 500);
    }   
}

// Funkcja, która finalizuje wysyłanie plików do udostępnionego linku.
// Wszystkie dane są pobierane z requestu, oraz są zapisywane do bazy danych. (Takie jak informacje o plikach, oraz informacje o udostępnionym linku)

export async function finalizeUploadService({ c, user }: FinalizeUploadServiceProps) {
    const { 
        slug,
        files,
        isPrivate,
        accessCode,
        visibility,
        time 
    } = await c.req.json();

    try {
        // Najpierw tworzymy wpis w shares
        const shareResult = await db.insert(shares).values({
            slug: slug,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + (time === "24" ? 24 * 60 * 60 * 1000 : time === "168" ? 7 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000)), 
            userId: user ? user.id : null,
            private: isPrivate,
            code: accessCode ? await hashCode(accessCode) : null,
            visibility: visibility,
            ipAddress: c.req.header("x-forwarded-for") || null,
            userAgent: c.req.header("user-agent") || null,
        }).returning({ id: shares.id });

        // Następnie dodajemy informacje o plikach
        await Promise.all(files.map(async (file: { fileName: string; size: number }) => {
            await db.insert(uploadedFiles).values({
                shareId: shareResult[0].id,
                fileName: file.fileName,
                size: file.size,
                storagePath: `${slug}/${file.fileName}`, 
            })
        }));

        return c.json({
            message: "Pliki zostały wysłane pomyślnie",
            shareId: shareResult[0].id
        });

    } catch (error) {
        return c.json({
            message: "Wystąpił błąd podczas wysyłania plików",
            error
        }, 500);
    }
}
