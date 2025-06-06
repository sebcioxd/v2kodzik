import type { S3UploadServiceProps } from "../lib/types.js";

import getS3Client from "../lib/s3.js";

export async function S3UploadService({ Key, Body }: S3UploadServiceProps) {
    const client = getS3Client({ bucket: "sharesbucket" });

    const result = await client.putObject(Key, Body, {
        metadata: {
            "Content-Type": "application/octet-stream",
        }
    })

    return result;

}
   