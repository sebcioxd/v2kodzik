import type { FinalizeUploadServiceProps, S3UploadServiceProps, CancelUploadServiceProps } from "../lib/types";
import { shares, uploadedFiles, signatures, cancelSignatures, sharesHistory } from "../db/schema";
import { fixRequestProps } from "../utils/req-fixer";
import { hashCode } from "../lib/hash";
import { db } from "../db/index";
import { sql, eq } from "drizzle-orm";
import { getS3Client } from "../lib/s3";
import { verifyCaptcha } from "../lib/captcha";
import { S3Client } from "bun";
import { MonthlyUsageService } from "./monthly-limits.service";
import { MonthlyIPLimitsService } from "./monthly-limits.service";
import { auth } from "../lib/auth";

export class UploadService {
    private client: S3Client;
    private monthlyService: MonthlyUsageService;
    private monthlyIPService: MonthlyIPLimitsService;

    constructor(bucket: string) {
        this.client = getS3Client({ bucket });
        this.monthlyService = new MonthlyUsageService();
        this.monthlyIPService = new MonthlyIPLimitsService();
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

    public async uploadFiles({ c, user, bodyData }: S3UploadServiceProps) {
        try {
            const { token, fileSizes, slug, fileNames, contentTypes, isPrivate, accessCode, visibility, time } = bodyData;

            try {
                await verifyCaptcha({ c, token });
            } catch (error) {
                return c.json({
                    message: `Nie udało się zweryfikować captchy. ${error}`,
                }, 400);
            }

            const req = {
                slug,
                fileNames,
                contentTypes,
                isPrivate,
                accessCode,
                visibility,
                time: time.toString()
            };

            const result = await fixRequestProps(req, c, user);

            if (result instanceof Response) {
                return result;
            }

            const validatedReq = result;
            const totalSizeInMB = fileSizes?.reduce((acc, size) => acc + (size / (1024 * 1024)), 0) || 0;
            const totalFiles = fileSizes?.length || 0;


            if (user && fileSizes) {
                
                const limitCheck = await this.monthlyService.updateMonthlyLimits({ 
                    c, 
                    user, 
                    megabytesUsed: totalSizeInMB,
                    filesUploaded: totalFiles
                });

                if (limitCheck.status === 400) {
                    return c.json({
                        message: "Limit miesięczny transferu został przekroczony.",
                        success: false,
                        hasReachedLimit: true,
                    }, 400);
                }

                const subscriptions = await auth.api.listActiveSubscriptions({
                    query: {
                        referenceId: user.id,
                    },
                    headers: c.req.raw.headers,
                })

                const getSubscription = subscriptions.find((subscription) => subscription.status === "active");

                if (!getSubscription && totalSizeInMB > 50) {
                    return c.json({
                        message: "Za duży rozmiar plików na planie Free",
                        success: false,
                        hasReachedLimit: true,
                    }, 400);
                }

                // basic plan check
                if (getSubscription?.priceId === "price_1RrpUM12nSzGEbfJ2YnfVFtE" && totalSizeInMB > 1000) {
                    return c.json({
                        message: "Za dużo plików na planie Basic",
                        success: false,
                        hasReachedLimit: true,
                    }, 400);
                }

                // plus plan check
                if (getSubscription?.priceId === "price_1RrpaS12nSzGEbfJhRq73THv" && totalSizeInMB > 2000) {
                    return c.json({
                        message: "Za dużo plików na planie Basic Plus",
                        success: false,
                        hasReachedLimit: true,
                    }, 400);
                }

                // pro plan check
                if (getSubscription?.priceId === "price_1Rrpbc12nSzGEbfJco6U50U7" && totalSizeInMB > 2000) {
                    return c.json({
                        message: "Za dużo plików na planie Basic Pro",
                        success: false,
                        hasReachedLimit: true,
                    }, 400);
                }
                
            }

            if (!user && totalSizeInMB > 50) {
                return c.json({
                    message: "Za duży rozmiar plików na planie Free",
                    success: false,
                    hasReachedLimit: true,
                }, 400);
            }

            /**
                INTENCJONALNE SPRAWDZENIE LIMITU ADRESU IP, JEŚLI NIE MA UŻYTKOWNIKA.
            */
            if (!user) {
                const ipAddress = c.req.header("CF-Connecting-IP") || c.req.header("x-forwarded-for") || "127.0.0.1";
                const limitCheck = await this.monthlyIPService.updateMonthlyLimits({ 
                    c, 
                    ipAddress, 
                    megabytesUsed: totalSizeInMB 
                });

                if (limitCheck.status === 400) {
                    return c.json({
                        message: "Limit miesięczny transferu został przekroczony, załóż konto aby uniknąć ograniczeń",
                        success: false,
                        hasReachedLimit: true,
                    }, 400);
                }
            }

            const presignedData = await Promise.all(validatedReq.fileNames.map(async (fileName: string, index: number) => {
                const uploadService = this.generatePresignedUrl(
                    `${validatedReq.slug}/${fileName}`, 
                    validatedReq.contentTypes[index] || validatedReq.contentTypes[0]
                );
                return {
                    fileName,
                    contentType: validatedReq.contentTypes[index] || validatedReq.contentTypes[0],
                    ...uploadService
                };
            }));

            const { signature, cancelSignature } = await this.generateSignatures(validatedReq.slug || "");

            return c.json({
                presignedData,
                slug: validatedReq.slug,
                time: parseFloat(validatedReq.time),
                finalize_signature: signature,
                cancel_signature: cancelSignature
            });

        } catch (error) {
            return c.json({
                message: "Błąd podczas generowania presigned URL",
                error
            }, 500);
        }   
    }

    public async cancelUpload({ c, slug, body }: CancelUploadServiceProps) {
        const { cancel_signature } = body;

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
                }).returning({ id: shares.id, slug: shares.slug, visibility: shares.visibility, code: shares.code, expiresAt: shares.expiresAt, userAgent: shares.userAgent, ipAdress: shares.ipAddress });

                /*
                ADD THE SHARE INFO ALSO TO THE HISTORY
                */
                await tx.insert(sharesHistory).values({
                    id: shareResult[0].id, 
                    slug: shareResult[0].slug,
                    visibility: shareResult[0].visibility,
                    private: isPrivate,
                    userId: user ? user.id : null,
                    code: shareResult[0].code,
                    expiresAt: shareResult[0].expiresAt,
                    userAgent: shareResult[0].userAgent,
                    ipAddress: shareResult[0].ipAdress, 
                });

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