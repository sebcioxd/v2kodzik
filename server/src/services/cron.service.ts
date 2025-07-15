import type {
    DeleteExpireFilesServiceBody,
    DeleteExpireFilesServiceProps,
  } from "../lib/types";
  import { shares, snippets } from "../db/schema";
  import { CRON_BODY_KEY } from "../lib/env";
  import { sendWebhookService } from "./webhook.service";
  import { deleteGhostFilesService } from "./ghost.service";
  import { sql, lt } from "drizzle-orm";
  import { db } from "../db/index";
  import { getS3AdminClient } from "../lib/s3";
  

  const client = getS3AdminClient({ bucket: "sharesbucket" });

  async function deleteS3FilesBatch(filesToDelete: string[], batchSize = 10) {
    const deletionResults: string[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < filesToDelete.length; i += batchSize) {
      const batch = filesToDelete.slice(i, i + batchSize);
      
      const promises = batch.map(async (file) => {
        try {
          await client.delete(file);
          return { success: true, file };
        } catch (error) {
          console.error(`Nie udało się usunąć pliku ${file}:`, error);
          return { success: false, file, error };
        }
      });
      
      const results = await Promise.allSettled(promises);
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          deletionResults.push(result.value.file);
        } else {
          errors.push(result.status === 'fulfilled' ? result.value.file : 'Unknown error');
        }
      }
    }
    
    return { deletionResults, errors };
  }
  
  export async function deleteExpireFilesService({
    c,
  }: DeleteExpireFilesServiceProps) {
    const body: DeleteExpireFilesServiceBody = await c.req.json();
  
    if (body.key !== CRON_BODY_KEY) {
      return c.json(
        {
          message: "Nieprawidłowy klucz",
        },
        401
      );
    }
  
    try {
      await db.delete(shares).where(lt(shares.expiresAt, sql`NOW()`));
  
      const deletedSnippets = await db
      .delete(snippets)
      .where(lt(snippets.expiresAt, sql`NOW()`))
      .returning({ slug: snippets.slug });
    
      const snippetsToDeleteSlugs = deletedSnippets.map(s => s.slug);
  
      if (snippetsToDeleteSlugs.length > 0) {
        await sendWebhookService({
          content: `Pomyślnie usunięto ${snippetsToDeleteSlugs.length} ${snippetsToDeleteSlugs.length === 1 ? "snippet" : "snippetów"}. Usunięte snippety: ${snippetsToDeleteSlugs.join(", ")}`,
        });
      } else {
        await sendWebhookService({
          content: `Sprawdzono snippety, nie ma żadnych do usunięcia.`,
      });
      }
      
  
      const folders: string[] = [];
      const listResponse = await client.list();
      if (listResponse.contents) {
        for (const obj of listResponse.contents) {
          folders.push(obj.key);
        }
      }
  
      const slugs = await db.select({ slug: shares.slug }).from(shares);
  
      const foldersToDelete = folders.filter(
        (folder) => !slugs.some((slug) => slug.slug === folder.split("/")[0])
      );
  
      const { deletionResults, errors } = await deleteS3FilesBatch(foldersToDelete);
  
      await sendWebhookService({
        content: deletionResults.length > 0 ? 
        `Pomyślnie usunięto ${deletionResults.length} ${deletionResults.length === 1 ? "plik" : "plików"}. Usunięte pliki: ${deletionResults.map(path => path.split("/").pop()).join(", ")}` : 
        `Sprawdzono pliki, nie ma żadnych do usunięcia.`,
      });
  
      // Delete files that do not have uploaded files
      await deleteGhostFilesService({ c });
  
      return c.json({
        deletionResults,
        errors,
      });
  
    } catch (error) {
      return c.json(
        {
          message: "Wystąpił błąd wewnętrzny serwera",
        },
        500
      );
    }
  }
  