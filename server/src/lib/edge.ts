/* 
**
** TO JEST FUNKCJA JEŚLI MACIE MOŻLIWOŚĆ UŻYWANIA EDGE FUNKCJI
** JEST TO ZASTĄPIENIE ZAMIAST TRADYCYJNEGO /v1/cron.
** TESTOWE URUCHOMIENIE: bun run src/lib/edge
**
*/



import { S3Client, SQL } from "bun";

const DISCORD_WEBHOOK_URL = Bun.env.DISCORD_WEBHOOK_URL!
const S3_REGION = Bun.env.S3_REGION!
const S3_ENDPOINT = Bun.env.S3_ENDPOINT!
const S3_ADMIN_ACCESS_KEY = Bun.env.S3_ADMIN_ACCESS_KEY!
const S3_ADMIN_SECRET_KEY = Bun.env.S3_ADMIN_SECRET_KEY!
const DATABASE_URL = Bun.env.DATABASE_URL!

const sql = new SQL(DATABASE_URL);

export async function sendWebhookService({ content }: { content: string }) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, 
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content: content,
        }),
    });

  } catch (error) {
    console.error("Nie udało się wysłać webhooka", error);
  }
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
      if (result.status === "fulfilled" && result.value.success) {
        deletionResults.push(result.value.file);
      } else {
        errors.push(
          result.status === "fulfilled" ? result.value.file : "Unknown error"
        );
      }
    }
  }

  return { deletionResults, errors };
}

export async function deleteExpireFilesService() {
  try {
    await sql`DELETE FROM shares WHERE expires_at < NOW()`;

    const deletedSnippets = await sql`
      DELETE FROM snippets 
      WHERE expires_at < NOW() 
      RETURNING slug
    `;
    
    const snippetsToDeleteSlugs = deletedSnippets.map((row: any) => row.slug);

    if (snippetsToDeleteSlugs.length > 0) {
      await sendWebhookService({
        content: `Pomyślnie usunięto ${snippetsToDeleteSlugs.length} ${
          snippetsToDeleteSlugs.length === 1 ? "snippet" : "snippetów"
        }. Usunięte snippety: ${snippetsToDeleteSlugs.join(", ")}`,
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

    const slugsResult = await sql`SELECT slug FROM shares`;
    const slugs = slugsResult.map((row: any) => ({ slug: row.slug }));

    const foldersToDelete = folders.filter(
      (folder) => !slugs.some((slug: any) => slug.slug === folder.split("/")[0])
    );


    if (foldersToDelete.length > 0) {
    const { deletionResults } = await deleteS3FilesBatch(
      foldersToDelete
    );

    await sendWebhookService({
      content: deletionResults.length > 0 ? 
      `Pomyślnie usunięto ${deletionResults.length} ${deletionResults.length === 1 ? "plik" : "plików"}. Usunięte pliki: ${deletionResults.map(path => path.split("/").pop()).join(", ")}` : 
      `Sprawdzono pliki, nie ma żadnych do usunięcia.`,
    });
    
    }

  } catch (error) {
    console.error(error);
  }
}

export async function deleteGhostFilesService() {
  try {
    const shareWithoutFiles = await sql`
      SELECT s.id, s.slug 
      FROM shares s
      LEFT JOIN uploaded_files uf ON s.id = uf.share_id
      WHERE uf.id IS NULL
    `;

    if (shareWithoutFiles.length === 0) {
      await sendWebhookService({
        content: "Nie znaleziono udostępnień bez plików do usunięcia.",
      });
      return;
    }

    const deletionResults: string[] = [];
    const failedDeletions: string[] = [];

    for (const share of shareWithoutFiles) {
      try {
        await client.delete(share.slug);
        deletionResults.push(share.id);
      } catch (error) {
        failedDeletions.push(share.slug);
        console.error(`Failed to delete S3 object for slug ${share.slug}:`, error);
      }
    }

    if (deletionResults.length > 0) {
      await sql`
        DELETE FROM shares 
        WHERE id = ANY(${deletionResults})
      `;
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

export async function runCronTasks() {
  try {
    await deleteExpireFilesService();
    await deleteGhostFilesService();
  } catch (error) {
    console.error('Error running cron tasks:', error);
  }
}

runCronTasks();