import type { DownloadFileServiceProps, DownloadBulkFilesServiceProps } from "../lib/types";
import { getS3Client } from "../lib/s3";
import { S3Client } from "bun";
import { CDN_URL } from "../lib/env";

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
    private getCachedUrl(path: string) {
        return `${CDN_URL}/${path}`
    }

    public async downloadFile({ path, c }: DownloadFileServiceProps) {
        try {
            const presignedUrl = this.getCachedUrl(path);
            
            // Przyjazne dla CDN'a nagłówki
            c.header('Cache-Control', 'public, max-age=3600');
            c.header('CDN-Cache-Control', 'public, max-age=86400');
            c.header('Vary', 'Accept-Encoding');

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
            const presignedUrls = paths.map((path) => {
                const url = this.getCachedUrl(path);
                return { url, fileName: path.split("/").pop() || "unknown" };
            });
            return c.json({ urls: presignedUrls });
        } catch (err) {
            return c.json({
                message: "Wystąpił błąd podczas pobierania plików",
                error: err,
            }, 500);
        }
    }
}


// const client = getS3Client({ bucket: "sharesbucket" });

// export async function downloadFileService({ path, c }: DownloadFileServiceProps) {
//     try {
//         const presignedUrl = client.presign(path, {
//             expiresIn: 200,
//             method: "GET",
//         });

//         return c.json({ url: presignedUrl });
//     } catch (err) {
//         return c.json({
//             message: "Wystąpił błąd podczas pobierania pliku",
//             error: err,
//         }, 500);
//     }
// }
// export async function downloadBulkFilesService({ paths, c }: DownloadBulkFilesServiceProps) {
//     try {
//         const presignedUrls = paths.map((path) => {
//             const url = client.presign(path, {
//                 expiresIn: 200,
//                 method: "GET",
//             });
//             const fileName = path.split("/").pop() || "unknown";
//             return { url, fileName };
//         });
        
//         return c.json({ urls: presignedUrls });
//     } catch (err) {
//         return c.json({
//             message: "Wystąpił błąd podczas pobierania plików",
//             error: err,
//         }, 500);
//     }
// }