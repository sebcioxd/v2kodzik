import type { S3UploadServiceProps } from "../lib/types.js";
import getS3Client from "../lib/s3.js";

export async function S3UploadService({ Key }: S3UploadServiceProps) {
    const client = getS3Client({ bucket: "sharesbucket" });

    const { url, fields } = await client.presignedPostObject(Key, {
        expirySeconds: 200, // 200 sekund
        fields: {
            "Content-Type": "application/octet-stream",
        }
    });

    return { url, fields };
}
   