import type {
  DeleteExpireFilesServiceBody,
  DeleteExpireFilesServiceProps,
} from "../lib/types.js";
import { shares } from "../db/schema.js";
import { CRON_BODY_KEY } from "../lib/env.js";
import { sendWebhookService } from "./webhook.service.js";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import getS3Client from "../lib/s3.js";

const s3Client = getS3Client({ bucket: "sharesbucket" });

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
    await db.delete(shares).where(sql`expires_at < NOW()`);

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
      `Pomyślnie usunięto ${deletionResults.length} ${deletionResults.length === 1 ? "plik" : "plików"}. Usunięte pliki: ${deletionResults.join(", ").split("/").slice(0, -1).join("/")}` : 
      `Sprawdzono pliki, nie ma żadnych do usunięcia.`,
    });

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
