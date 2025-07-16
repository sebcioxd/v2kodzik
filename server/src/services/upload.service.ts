import type { FinalizeUploadServiceProps, generatePresignedUrlProps, S3UploadServiceProps, UploadRequestProps, CancelUploadServiceProps } from "../lib/types";
import { fixRequestProps } from "../utils/req-fixer";
import { shares, uploadedFiles } from "../db/schema";
import { hashCode } from "../lib/hash";
import { db } from "../db/index";
import { sql } from "drizzle-orm";
import { getS3Client } from "../lib/s3";
import { verifyCaptcha } from "../lib/captcha";
import { S3Client } from "bun";

export class UploadService {
    private client: S3Client;
    
    constructor(bucket: string) {
        this.client = getS3Client({ bucket });
    }

    private generatePresignedUrl(key: string) {
        if (!key || typeof key !== 'string') {
            throw new Error('Invalid Key provided');
        }

        if (key.includes('..') || key.startsWith('/')) {
            throw new Error('Invalid file path');
        }

        const url = this.client.presign(key, {
            expiresIn: 600,
            method: "PUT",
            type: "application/octet-stream",
            acl: "public-read",
        });

        return { url };
    }

    public async uploadFiles({ c, user }: S3UploadServiceProps) {
        try {
            const { slug, isPrivate, accessCode, visibility, time } = c.req.query();
            const fileNames = c.req.query("fileNames")?.split(",");

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
                const uploadService = this.generatePresignedUrl(`${req.slug}/${fileName}`);
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

    public async cancelUpload({ c }: CancelUploadServiceProps) {
        const { slug } = c.req.query();

        const checkForUploadedFiles = await db
            .select()
            .from(uploadedFiles)
            .where(sql`${uploadedFiles.storagePath} LIKE ${slug + '/%'}`);

        const hasFiles = checkForUploadedFiles.length > 0;

        if (hasFiles) {
            return c.json({
                message: "Pliki zostały już wysłane",
            }, 400);
        }
    }

    public async finalizeUpload({ c, user }: FinalizeUploadServiceProps) {
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

                const fileInserts = files.map((file: { fileName: string; size: number }) => ({
                    shareId: shareResult[0].id,
                    fileName: file.fileName,
                    size: file.size,
                    storagePath: `${slug}/${file.fileName}`,
                }));
                
                await tx.insert(uploadedFiles).values(fileInserts);

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
}