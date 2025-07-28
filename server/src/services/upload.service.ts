import type { FinalizeUploadServiceProps, generatePresignedUrlProps, S3UploadServiceProps, UploadRequestProps, CancelUploadServiceProps } from "../lib/types";
import { fixRequestProps } from "../utils/req-fixer";
import { shares, uploadedFiles, signatures, cancelSignatures } from "../db/schema";
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

    private async generateSignatures(slug: string) {
        const signature = Bun.randomUUIDv7();
        const cancelSignature = Bun.randomUUIDv7();

        await Promise.all([
            db.insert(signatures).values({
                signature,
            }),
            db.insert(cancelSignatures).values({
                signature: cancelSignature,
                slug,
            }),
        ]);

        return { signature, cancelSignature };
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

            const { signature, cancelSignature } = await this.generateSignatures(req.slug || "");

            return c.json({
                presignedData,
                slug: req.slug,
                time: parseFloat(req.time),
                finalize_signature: signature,
                cancel_signature: cancelSignature
            }); 6

        } catch (error) {
            return c.json({
                message: "Błąd podczas generowania presigned URL",
                error
            }, 500);
        }   
    }

    public async cancelUpload({ c, slug }: CancelUploadServiceProps) {
        const { cancel_signature } = await c.req.json();

        if (!cancel_signature) {
            return c.json({
                message: "Podpis anulowania jest wymagany",
            }, 400);
        }

        const cancelSignatureCheck = await db.select().from(cancelSignatures).where(eq(cancelSignatures.signature, cancel_signature));

        if (!cancelSignatureCheck || cancelSignatureCheck.length === 0 || cancelSignatureCheck[0].expiresAt < new Date()) {
            return c.json({
                message: "Nieprawidłowy podpis anulowania",
            }, 400);
        }

        if (cancelSignatureCheck[0].slug !== slug) {
            return c.json({
                message: "Nieprawidłowy podpis anulowania",
            }, 400);
        }

        const share = await db.select().from(shares).where(eq(shares.slug, slug)).limit(1);
    
        if (!share || share.length === 0) {
            return c.json({
                message: "Nie znaleziono udostępnienia",
            }, 404);
        }
    
        const slugUploadedFiles = await db.select().from(uploadedFiles).where(eq(uploadedFiles.shareId, share[0].id));

        await Promise.all(slugUploadedFiles.map(async (file) => {
            this.client.delete(file.storagePath);
        }));

        await Promise.all([
            db.delete(cancelSignatures).where(eq(cancelSignatures.signature, cancel_signature)),
            db.delete(shares).where(eq(shares.slug, slug)),
        ]);

        return c.json({
            message: "Pliki zostały anulowane pomyślnie",
        }, 200);
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
                    lastModified: file.lastModified.toString(),
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