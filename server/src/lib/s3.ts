import { S3Client } from "bun";

import { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_ADMIN_ACCESS_KEY, S3_ADMIN_SECRET_KEY } from "./env";

export function getS3Client({ bucket }: { bucket: string }) {
  
    const s3Client = new S3Client({
        endpoint: S3_ENDPOINT,
        region: S3_REGION,
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
        bucket: bucket,
    });
  
   return s3Client;
}

export function getS3AdminClient({ bucket }: { bucket: string }) {
  
    const s3Client = new S3Client({
        endpoint: S3_ENDPOINT,
        region: S3_REGION,
        accessKeyId: S3_ADMIN_ACCESS_KEY,
        secretAccessKey: S3_ADMIN_SECRET_KEY,
        bucket: bucket,
    });
  
   return s3Client;
  }
