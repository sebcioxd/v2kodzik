import getS3Client from "../lib/s3.ts";
export async function S3UploadService({ Key, Body }) {
    const client = getS3Client({ bucket: "sharesbucket" });
    const result = await client.putObject(Key, Body, {
        metadata: {
            "Content-Type": "application/octet-stream",
        }
    });
    return result;
}
