import type { DownloadFileServiceProps, DownloadBulkFilesServiceProps } from "../lib/types.js";
import { S3Client } from "@bradenmacdonald/s3-lite-client";
import { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY } from "../lib/env.js";

const s3Client = new S3Client({
    endPoint: S3_ENDPOINT,
    region: S3_REGION,
    accessKey: S3_ACCESS_KEY,
    secretKey: S3_SECRET_KEY,
    bucket: "sharesbucket",
});

export async function downloadFileService({ path, c }: DownloadFileServiceProps) {
    try {
        const presignedUrl = await s3Client.presignedGetObject(path, {
            expirySeconds: 3600,
        });

        return c.json({ url: presignedUrl });
    } catch (err) {
        return c.json({
            message: "Server error has occurred",
            error: err,
        }, 500);
    }
}

export async function downloadBulkFilesService({ paths, c }: DownloadBulkFilesServiceProps) {
    try {
        const presignedUrls = await Promise.all(paths.map(async (path) => {
            const url = await s3Client.presignedGetObject(path, {
                expirySeconds: 3600,
            });
            const fileName = path.split("/").pop() || "unknown";
            return { url, fileName };
        }));

        return c.json({ urls: presignedUrls });
    } catch (err) {
        return c.json({
            message: "Server error has occurred",
            error: err,
        }, 500);
    }
}