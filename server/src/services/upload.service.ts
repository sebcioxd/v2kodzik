import type { FinalizeUploadServiceProps, generatePresignedUrlProps, S3UploadServiceProps, UploadRequestProps, CancelUploadServiceProps } from "../lib/types";
import { fixRequestProps } from "../utils/req-fixer";
import { shares, uploadedFiles, signatures } from "../db/schema";
import { hashCode } from "../lib/hash";
import { db } from "../db/index";
import { sql, eq } from "drizzle-orm";
import { getS3Client } from "../lib/s3";
import { verifyCaptcha } from "../lib/captcha";
import { S3Client } from "bun";

export class UploadService {
    private client: S3Client;
    
    constructor(bucket: string) {
        this.client = getS3Client({ bucket });
    }

    private generatePresignedUrl(key: string, contentType: string) {
        if (!key || typeof key !== 'string') {
            throw new Error('Invalid Key provided');
        }

        if (key.includes('..') || key.startsWith('/')) {
            throw new Error('Invalid file path');
        }

        const url = this.client.presign(key, {
            expiresIn: 600,
            method: "PUT",
            type: contentType,
            acl: "public-read",
        });

        return { url };
    }

    private async generateSignature() {
        const signature = Bun.randomUUIDv7();

        await db.insert(signatures).values({
            signature,
        });

        return signature;
    }

   
    public async uploadFiles({ c, user, queryData, bodyData }: S3UploadServiceProps) {
        try {
            const { token } = bodyData;

            try {
                await verifyCaptcha({ c, token });
            } catch (error) {
                return c.json({
                    message: `Nie udało się zweryfikować captchy. ${error}`,
                }, 400);
            }
            
            const result = await fixRequestProps(queryData, c, user);

            if (result instanceof Response) {
                return result;
            }

            const req = result;

            const presignedData = await Promise.all(req.fileNames.map(async (fileName, index) => {
                const uploadService = this.generatePresignedUrl(
                    `${req.slug}/${fileName}`, 
                    req.contentTypes[index] || req.contentTypes[0]
                );
                return {
                    fileName,
                    contentType: req.contentTypes[index] || req.contentTypes[0],
                    ...uploadService
                };
            }));

            const signature = await this.generateSignature();

            return c.json({
                presignedData,
                slug: req.slug,
                time: parseFloat(req.time),
                finalize_signature: signature
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

    public async finalizeUpload({ c, user, body }: FinalizeUploadServiceProps) {
        const { slug, files, isPrivate, accessCode, visibility, time, signature } = body;

        if (!signature) {
            return c.json({
                message: "Podpis jest wymagany",
            }, 400);
        }

        const signatureCheck = await db.select().from(signatures).where(eq(signatures.signature, signature));

        if (!signatureCheck || signatureCheck.length === 0 || signatureCheck[0].expiresAt < new Date()) {
            return c.json({
                message: "Nieprawidłowy podpis",
            }, 400);
        }

        await db.delete(signatures).where(eq(signatures.signature, signature));

        let expirationInterval: string;
            switch (time) {
                case 24:
                    expirationInterval = "24 hours";
                    break;
                case 168:
                    expirationInterval = "7 days";
                    break;
                default:
                    expirationInterval = "30 minutes";
                    break;
            }
        try {
            const result = await db.transaction(async (tx) => {
                const shareResult = await tx.insert(shares).values({
                    slug,
                    visibility,
                    private: isPrivate,
                    userId: user ? user.id : null,
                    code: accessCode ? await hashCode(accessCode) : null,
                    expiresAt: sql.raw(`NOW() + INTERVAL '${expirationInterval}'`),
                    userAgent: c.req.header("user-agent") || null,
                    ipAddress: c.req.header("CF-Connecting-IP") || c.req.header("x-forwarded-for") || "127.0.0.1",
                }).returning({ id: shares.id });

                const fileInserts = files.map((file: { fileName: string; size: number; contentType: string; lastModified: number }) => ({
                    shareId: shareResult[0].id,
                    fileName: file.fileName,
                    size: file.size,
                    contentType: file.contentType,
                    lastModified: file.lastModified,
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
                message: `Wystąpił błąd podczas wysyłania plików: ${error}`,
                error
            }, 500);
        }
    }
}