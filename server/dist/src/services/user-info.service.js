import { uploadedFiles, shares } from "../db/schema.ts";
import { db } from "../db/index.ts";
import { eq, desc, count } from "drizzle-orm";
export async function getUserHistoryService({ offset, limit, userId }) {
    const history = await db
        .select()
        .from(uploadedFiles)
        .fullJoin(shares, eq(uploadedFiles.shareId, shares.id))
        .where(eq(shares.userId, userId))
        .orderBy(desc(uploadedFiles.createdAt))
        .limit(limit)
        .offset(offset);
    return history;
}
export async function getUserHistoryCountService({ userId }) {
    const countHistory = await db
        .select({ count: count(shares.id) })
        .from(uploadedFiles)
        .fullJoin(shares, eq(uploadedFiles.shareId, shares.id))
        .where(eq(shares.userId, userId));
    return countHistory[0].count;
}
