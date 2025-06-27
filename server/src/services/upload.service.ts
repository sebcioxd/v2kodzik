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

    const { slug, isPrivate, accessCode, visibility, time } = c.req.query();
    const fileNames = c.req.query("fileNames")?.split(",");

    const result = await fixRequestProps({ slug, isPrivate, accessCode, visibility, time, fileNames: fileNames || [] }, c, user);

    if (result instanceof Response) {
        return result;
    }

    const req: UploadRequestProps = result;

    try {
        const presignedData = await Promise.all(req.fileNames.map(async (fileName) => {
            const uploadService = await generatePresignedUrl({
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
            message: "Błąd podczas generowania presigned URL",
            error
        }, 500);
    }   

}

// Funkcja, która finalizuje wysyłanie plików do udostępnionego linku.
// Wszystkie dane są pobierane z requestu, oraz są zapisywane do bazy danych. (Takie jak informacje o plikach, oraz informacje o udostępnionym linku)

export async function finalizeUploadService({ c }: FinalizeUploadServiceProps) {
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

}
