import { shares, uploadedFiles } from "../db/schema.js";
import { sendWebhookService } from "./webhook.service.js";
import { sql, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import getS3Client from "../lib/s3.js";
import type { Context } from "hono";
  
  const s3Client = getS3Client({ bucket: "sharesbucket" });
  
  export async function deleteGhostFilesService({
    c,
  }: {
    c: Context;
  }) {
    try {
      // Find shares without files
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
          content: "Nie znaleziono udostępnień bez plików do usunięcia.",
        });
        return;
      }
      const deletionResults = [];
      const failedDeletions = [];

      for (const share of shareWithoutFiles) {
        try {
          await s3Client.deleteObject(share.slug);
          deletionResults.push(share.id);
        } catch (error) {
          failedDeletions.push(share.slug);
          console.error(`Failed to delete S3 object for slug ${share.slug}:`, error);
        }
      }

      if (deletionResults.length > 0) {
        await db.delete(shares)
          .where(inArray(shares.id, deletionResults));
      }

      const successMessage = deletionResults.length > 0 
        ? `Pomyślnie usunięto ${deletionResults.length} ${deletionResults.length === 1 ? 'udostępnienie które nie ma plików' : 'udostępnienia które nie mają plików'}.`
        : '';
      
      const failureMessage = failedDeletions.length > 0
        ? `Nie udało się usunąć ${failedDeletions.length} ${failedDeletions.length === 1 ? 'plików' : 'plików'}: ${failedDeletions.join(', ')}`
        : '';

      await sendWebhookService({
        content: [successMessage, failureMessage].filter(Boolean).join('\n')
      });

    } catch (error) {
      await sendWebhookService({
        content: `Wystąpił błąd podczas usuwania plików: ${error}`,
      });
    }
  }
  