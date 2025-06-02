import { Hono } from "hono";
import { Data } from "hono/dist/types/context";
import JSZip from 'jszip';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_REGION } from "../lib/env";

const downloadRoute = new Hono();

const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: MINIO_REGION,
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY
  },
  forcePathStyle: true 
});

downloadRoute.post("/", async (c) => {
  const { path } = await c.req.json();
  
  try {
    const command = new GetObjectCommand({
      Bucket: 'sharesbucket',
      Key: path,
    });
    
    const response = await s3Client.send(command);
    const data = await response.Body?.transformToByteArray();
    
    if (!data) {
      return c.json({ message: "File not found" }, 404);
    }

    c.header("Content-Type", "application/octet-stream");
    c.header("Content-Disposition", "attachment");

    return c.body(data as unknown as Data);
  } catch (error) {
    console.error('Download error:', error);
    return c.json({ message: "Error downloading file" }, 500);
  }
});

downloadRoute.post("/bulk", async (c) => {
  const { paths } = await c.req.json();
  const zip = new JSZip();
  
  try {
    const filePromises = paths.map(async (path: string) => {
      const command = new GetObjectCommand({
        Bucket: 'sharesbucket',
        Key: path,
      });
      
      const response = await s3Client.send(command);
      const data = await response.Body?.transformToByteArray();
      
      if (!data) throw new Error("File not found");

      const fileName = path.split('/').pop() || 'unknown';
      zip.file(fileName, data);
    });

    await Promise.all(filePromises);

    const zipContent = await zip.generateAsync({ type: "blob" });
    
    c.header("Content-Type", "application/zip");
    c.header("Content-Disposition", `attachment; filename=kodzik.zip`);
    
    return c.body(zipContent as unknown as Data);
  } catch (error) {
    console.error('Bulk download error:', error);
    return c.json({ message: "Wystąpił błąd podczas tworzenia pliku zip" }, 500);
  }
});

export default downloadRoute;