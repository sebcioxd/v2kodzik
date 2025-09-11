import type { DownloadFileServiceProps, DownloadBulkFilesServiceProps } from "../lib/types";
import { getS3Client } from "../lib/s3";
import { S3Client } from "bun";
import { CDN_URL } from "../lib/env";
import { uploadedFiles } from "../db/schema";
import { db } from "../db/index";
import { eq, sql } from "drizzle-orm";

export class DownloadService {
    private client: S3Client;

    constructor(bucket: string) {
        this.client = getS3Client({ bucket });
    }

    // Jeśli nie mamy CDN'a, to pobieramy plik z S3 za pomocą presigned url
    private getPresignedUrl(path: string) {
        return this.client.presign(path, {
            expiresIn: 200,
            method: "GET",
        })
    }

    // Jeśli mamy CDN'a, to pobieramy plik z CDN'a
    // Warto zaznaczyć, że to może być problemtayczne jeśli chodzi o zachowanie prywatności użytkownika
    private getCachedUrl(path: string) {
        return `${CDN_URL}/${path}`
    }

    private async trackDownload(path: string) {
        await db.update(uploadedFiles).set({ downloadCount: sql`${uploadedFiles.downloadCount} + 1` }).where(eq(uploadedFiles.storagePath, path));
    }


    public async downloadFile({ path, c }: DownloadFileServiceProps) {
        try {
            const presignedUrl = this.getCachedUrl(path);

            // Przyjazne dla CDN'a nagłówki
            c.header('Cache-Control', 'public, max-age=3600');
            c.header('CDN-Cache-Control', 'public, max-age=86400');
            c.header('Vary', 'Accept-Encoding');

            await this.trackDownload(path);

            return c.json({ url: presignedUrl });
        } catch (err) {
            return c.json({
                message: "Wystąpił błąd podczas pobierania pliku",
                error: err,
            }, 500);
        }
    }
    
    public async downloadBulkFiles({ paths, c }: DownloadBulkFilesServiceProps) {
        try {
            const presignedUrls = await Promise.all(
                paths.map(async (path) => {
                    const url = this.getCachedUrl(path);
                    await this.trackDownload(path);
                    return { url, fileName: path.split("/").pop() || "unknown" };
                })
            );
            return c.json({ urls: presignedUrls });
        } catch (err) {
            return c.json({
                message: "Wystąpił błąd podczas pobierania plików",
                error: err,
            }, 500);
        }
    }
}

