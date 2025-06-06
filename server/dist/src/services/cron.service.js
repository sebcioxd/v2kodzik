import { shares } from "../db/schema.ts";
import { CRON_BODY_KEY } from "../lib/env.ts";
import { sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import getS3Client from "../lib/s3.ts";
const s3Client = getS3Client({ bucket: "sharesbucket" });
export async function deleteExpireFilesService({ c, }) {
    const body = await c.req.json();
    if (body.key !== CRON_BODY_KEY) {
        return c.json({
            message: "Invalid key",
        }, 401);
    }
    try {
        await db.delete(shares).where(sql `expires_at < NOW()`);
        const folders = [];
        for await (const obj of s3Client.listObjects()) {
            folders.push(obj.key);
        }
        const slugs = await db.select({ slug: shares.slug }).from(shares);
        const foldersToDelete = folders.filter((folder) => !slugs.some((slug) => slug.slug === folder.split("/")[0]));
        const deletionResults = [];
        for (const folder of foldersToDelete) {
            deletionResults.push(folder);
            await s3Client.deleteObject(folder);
        }
        return c.json({
            deletionResults,
        });
    }
    catch (error) {
        return c.json({
            message: "Internal server error",
        }, 500);
    }
}
