import type { DownloadFileServiceProps, DownloadBulkFilesServiceProps } from "../lib/types";
import { getS3Client } from "../lib/s3";

const client = getS3Client({ bucket: "sharesbucket" });

export async function downloadFileService({ path, c }: DownloadFileServiceProps) {
    try {
        const presignedUrl = client.presign(path, {
            expiresIn: 200,
            method: "GET",
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
            const url = client.presign(path, {
                expiresIn: 200,
                method: "GET",
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