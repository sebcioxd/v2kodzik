import { shares, uploadedFiles } from "../db/schema.js";
import { sendWebhookService } from "./webhook.service.js";
import { sql, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import getS3Client from "../lib/s3.js";
import type { Context } from "hono";
  
  const s3Client = getS3Client({ bucket: "sharesbucket" });
  
  export async function deleteGhostFilesService({
    c,
  }: {
    c: Context;
  }) {
    // remove shares, that do not have uploaded files
    
    const shareWithoutFiles = await db
      .select({
        id: shares.id,
        slug: shares.slug
      })
      .from(shares)
      .leftJoin(uploadedFiles, eq(shares.id, uploadedFiles.shareId))
      .where(sql`${uploadedFiles.id} IS NULL`);

    if (shareWithoutFiles.length === 0) {
      await sendWebhookService({
        content: "Nie znaleziono udostępnień do usunięcia.",
      });
    }

    await db.delete(shares)
      .where(sql`id IN (${sql.join(shareWithoutFiles.map(share => share.id))})`);

    for (const share of shareWithoutFiles) {
      try {
        await s3Client.deleteObject(share.slug);
      } catch (error) {
        console.error(`Nie udało się usunąć pliku ${share.slug}:`, error);
      }
    }

    await sendWebhookService({
      content: `Pomyślnie usunięto ${shareWithoutFiles.length} ${shareWithoutFiles.length === 1 ? 'udostępnienie' : 'udostępnienia'}.`,
    });
  }
  