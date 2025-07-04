import { S3Client } from "@bradenmacdonald/s3-lite-client";
import { S3_ENDPOINT, S3_REGION, S3_ADMIN_ACCESS_KEY, S3_ADMIN_SECRET_KEY } from "./env.js";

export default function getS3AdminClient({ bucket }: { bucket: string }) {
  
  const s3Client = new S3Client({
      endPoint: S3_ENDPOINT,
      region: S3_REGION,
      accessKey: S3_ADMIN_ACCESS_KEY,
      secretKey: S3_ADMIN_SECRET_KEY,
      bucket: bucket,
  });

 return s3Client;
}