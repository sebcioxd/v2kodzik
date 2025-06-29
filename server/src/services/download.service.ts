import type { DownloadFileServiceProps, DownloadBulkFilesServiceProps } from "../lib/types.js";
import getS3Client from "../lib/s3.js";

const s3Client = getS3Client({
    bucket: "sharesbucket",
});

export async function downloadFileService({ path, c }: DownloadFileServiceProps) {
    try {
        const presignedUrl = await s3Client.presignedGetObject(path, {
            expirySeconds: 200,
            requestDate: new Date(),
            bucketName: "sharesbucket",
        });

        return c.json({ url: presignedUrl });
    } catch (err) {
        return c.json({
            message: "Wystąpił błąd podczas pobierania pliku",
            error: err,
        }, 500);
    }
}

export async function downloadBulkFilesService({ paths, c }: DownloadBulkFilesServiceProps) {
    try {
        const presignedUrls = await Promise.all(paths.map(async (path) => {
            const url = await s3Client.presignedGetObject(path, {
                expirySeconds: 200,
                requestDate: new Date(),
                bucketName: "sharesbucket",
            });
            const fileName = path.split("/").pop() || "unknown";
            return { url, fileName };
        }));

        return c.json({ urls: presignedUrls });
    } catch (err) {
        return c.json({
            message: "Wystąpił błąd podczas pobierania plików",
            error: err,
        }, 500);
    }
}