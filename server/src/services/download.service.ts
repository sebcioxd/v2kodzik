import type { DownloadFileServiceProps, DownloadBulkFilesServiceProps } from "../lib/types.ts";
import { BlobWriter, ZipWriter } from "@zip.js/zip.js";
import getS3Client from "../lib/s3.ts";

const s3Client = getS3Client({ bucket: "sharesbucket" });

export async function downloadFileService({ path, c }: DownloadFileServiceProps) {
    try {
        const response = await s3Client.getObject(path);

        if (!response) {
            return c.json({
                message: "File not found",
            }, 404)
        }

        const arrBuffer = await response.arrayBuffer();
        return c.body(new Uint8Array(arrBuffer));
        
    } catch (err) {
        return c.json({
            message: "Server error has occured",
            error: err,
        }, 500)
    }

}

export async function downloadBulkFilesService({ paths, c }: DownloadBulkFilesServiceProps) {
    const zipWriter = new ZipWriter(new BlobWriter("application/zip"));
    
    try {
        await Promise.all(paths.map(async (path: string) => {
            const response = await downloadFileService({ 
                path, 
                c 
            });
            
            if (!(response instanceof Response) || !response.ok) {
                return c.json({
                    message: `Failed to download file: ${path}`,
                }, 404)
            }

            const data = await response.arrayBuffer();
            const fileName = path.split("/").pop() || "unknown";

            const blob = new Blob([new Uint8Array(data)]); // convert to blob because zip.js requires a blob

            await zipWriter.add(fileName, blob.stream());
        }));

        return await zipWriter.close();
    } catch (err) {
        await zipWriter.close();
        throw err;
    }
}