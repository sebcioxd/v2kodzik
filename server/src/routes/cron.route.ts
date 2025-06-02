import { Hono } from "hono";
import { db } from "../db";
import { shares } from "../db/schema";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { CRON_BODY_KEY, MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_REGION } from "../lib/env";
import { sql } from "drizzle-orm";

const cronRoute = new Hono();

const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: MINIO_REGION,
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY
  },
  forcePathStyle: true 
});

cronRoute.post("/", async (c) => {
    const body = await c.req.json();
    if (body.key !== CRON_BODY_KEY) {
        return c.json({ message: "Nieprawidłowy klucz" }, 401);
    }

    try {
        // First delete all expired shares from the database
        await db.delete(shares).where(sql`expires_at < NOW()`);

        // List all folders in the bucket
        const listCommand = new ListObjectsV2Command({
            Bucket: 'sharesbucket',
            Delimiter: '/'
        });
        
        const foldersList = await s3Client.send(listCommand);
        const folders = foldersList.CommonPrefixes?.map(prefix => ({
            name: prefix.Prefix?.replace('/', '') || ''
        })) || [];

        const slugs = await db.select().from(shares);

        // Find folders to delete
        const foldersToDelete = folders.filter((folder) => 
            !slugs.some((slug) => slug.slug === folder.name)
        );

        const deletionResults = [];

        // Delete folders and their contents
        for (const folder of foldersToDelete) {
            try {
                // List all objects in the folder
                const listFolderCommand = new ListObjectsV2Command({
                    Bucket: 'sharesbucket',
                    Prefix: `${folder.name}/`
                });
                
                const folderContents = await s3Client.send(listFolderCommand);
                
                if (folderContents.Contents && folderContents.Contents.length > 0) {
                    // Delete all objects in the folder
                    const deleteCommand = new DeleteObjectsCommand({
                        Bucket: 'sharesbucket',
                        Delete: {
                            Objects: folderContents.Contents.map(object => ({
                                Key: object.Key || ''
                            }))
                        }
                    });
                    
                    await s3Client.send(deleteCommand);
                    deletionResults.push({ 
                        folder: folder.name, 
                        success: true 
                    });
                }
            } catch (error) {
                deletionResults.push({ 
                    folder: folder.name, 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                });
            }
        }

        return c.json({ 
            message: "Operacja zakończona", 
            deletedFolders: deletionResults,
            totalProcessed: foldersToDelete.length
        }, 200);

    } catch (error) {
        console.error('Cron operation error:', error);
        return c.json({ 
            message: "Wystąpił błąd podczas operacji", 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, 500);
    }
});

export default cronRoute;