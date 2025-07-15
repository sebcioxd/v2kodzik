import type { FinalizeUploadServiceProps, generatePresignedUrlProps, S3UploadServiceProps, UploadRequestProps, CancelUploadServiceProps } from "../lib/types";
import { fixRequestProps } from "../utils/req-fixer";
import { shares, uploadedFiles } from "../db/schema";
import { hashCode } from "../lib/hash";
import { db } from "../db/index";
import { sql } from "drizzle-orm";
import { getS3Client } from "../lib/s3";
import { verifyCaptcha } from "../lib/captcha";
import { S3Client } from "bun";

// Klasa, która zarządza pojedynczym klientem S3.
// Jest to zrobione w celu uniknięcia tworzenia nowego klienta S3 za każdym razem, gdy jest to potrzebne.
class S3 {
    private static client: S3Client;

    static getClient() {
        if (!this.client) {
            this.client = getS3Client({ bucket: "sharesbucket" });
        }
        return this.client;
    }
}


// Funkcja, która generuje presigned URL dla plików do wysyłki.
export async function generatePresignedUrl({ Key }: generatePresignedUrlProps) {
    // Zabezpieczenia generowania url:
    const client = S3.getClient();
    if (!Key || typeof Key !== 'string') {
        throw new Error('Invalid Key provided');
    }

    if (Key.includes('..') || Key.startsWith('/')) {
        throw new Error('Invalid file path');
    }

    const url = client.presign(Key, {
        expiresIn: 600,
        method: "PUT",
        type: "application/octet-stream",
        acl: "public-read",
    })

    return { url }
}

// Funkcja, która generuje presigned URL dla plików do wysyłki, oraz zwraca wstępne dane do udostępnionego linku.
// Wszystkie dane są pobierane z requestu, oraz są walidowane.
// Nie jest to ostateczna funkcja, która tworzy udostępniony link, ale tylko generuje presigned URL dla plików do wysyłki.
   
export async function S3UploadService({ c, user }: S3UploadServiceProps) {
    try {
        const { slug, isPrivate, accessCode, visibility, time } = c.req.query();
        const fileNames = c.req.query("fileNames")?.split(",");

        // Walidacja czy człowiek nie jest robotem
        try {
            await verifyCaptcha({ c });
        } catch (error) {
            return c.json({
                message: `Nie udało się zweryfikować captchy. ${error}`,
            }, 400);
        }


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


export async function cancelUploadService({ c }: CancelUploadServiceProps) {
    const { slug } = c.req.query();

    const checkForUploadedFiles = await db
        .select()
        .from(uploadedFiles)
        .where(sql`${uploadedFiles.storagePath} LIKE ${slug + '/%'}`);

    // If length > 0, files exist for this slug
    const hasFiles = checkForUploadedFiles.length > 0;

    if (hasFiles) {
        return c.json({
            message: "Pliki zostały już wysłane",
        }, 400);
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
        const result = await db.transaction(async (tx) => {
            const shareResult = await tx.insert(shares).values({
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

            await Promise.all(files.map(async (file: { fileName: string; size: number }) => {
                await tx.insert(uploadedFiles).values({
                    shareId: shareResult[0].id,
                    fileName: file.fileName,
                    size: file.size,
                    storagePath: `${slug}/${file.fileName}`, 
                });
            }));

            return shareResult[0].id;
        });

        return c.json({
            message: "Pliki zostały wysłane pomyślnie",
            shareId: result
        });

    } catch (error) {
        return c.json({
            message: "Wystąpił błąd podczas wysyłania plików",
            error
        }, 500);
    }
}
