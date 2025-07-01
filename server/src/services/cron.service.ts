import type {
  DeleteExpireFilesServiceBody,
  DeleteExpireFilesServiceProps,
} from "../lib/types.js";
import { shares, snippets } from "../db/schema.js";
import { CRON_BODY_KEY } from "../lib/env.js";
import { sendWebhookService } from "./webhook.service.js";
import { deleteGhostFilesService } from "./ghost.service.js";
import { sql, lt } from "drizzle-orm";
import { db } from "../db/index.js";
import getS3AdminClient from "../lib/s3-admin.js";

const s3Client = getS3AdminClient({ bucket: "sharesbucket" });

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

    const snippetsToDelete = await db.select().from(snippets).where(lt(snippets.expiresAt, sql`NOW()`));

    const snippetsToDeleteSlugs: string[] = [];
    for (const snippet of snippetsToDelete) {
      snippetsToDeleteSlugs.push(snippet.slug);
    }
    await db.delete(snippets).where(lt(snippets.expiresAt, sql`NOW()`));

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
    for await (const obj of s3Client.listObjects()) {
      folders.push(obj.key);
    }

    const slugs = await db.select({ slug: shares.slug }).from(shares);

    const foldersToDelete = folders.filter(
      (folder) => !slugs.some((slug) => slug.slug === folder.split("/")[0])
    );

    const deletionResults: string[] = [];

    for (const folder of foldersToDelete) {
      try {
        await s3Client.deleteObject(folder);
        deletionResults.push(folder);
      } catch (error) {
        console.error(`Nie udało się usunąć pliku ${folder}:`, error);
      }
    }

    await sendWebhookService({
      content: deletionResults.length > 0 ? 
      `Pomyślnie usunięto ${deletionResults.length} ${deletionResults.length === 1 ? "plik" : "plików"}. Usunięte pliki: ${deletionResults.map(path => path.split("/").pop()).join(", ")}` : 
      `Sprawdzono pliki, nie ma żadnych do usunięcia.`,
    });

    // Delete files that do not have uploaded files
    await deleteGhostFilesService({ c });

    return c.json({
      deletionResults,
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
