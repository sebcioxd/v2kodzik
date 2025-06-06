import type { GetUserHistoryServiceProps, GetUserHistoryCountServiceProps } from "../lib/types.js";
import { uploadedFiles, shares } from "../db/schema.js";
import { db } from "../db/index.js";
import { eq, desc, count } from "drizzle-orm";



export async function getUserHistoryService({ offset, limit, userId }: GetUserHistoryServiceProps) {
    const history = await db
    .select()
    .from(uploadedFiles)
    .fullJoin(shares, eq(uploadedFiles.shareId, shares.id))
    .where(eq(shares.userId, userId))
    .orderBy(desc(uploadedFiles.createdAt))
    .limit(limit)
    .offset(offset)

    return history;
}

export async function getUserHistoryCountService({ userId }: GetUserHistoryCountServiceProps) {

    const countHistory = await db
    .select({ count: count(shares.id) })
    .from(uploadedFiles)
    .fullJoin(shares, eq(uploadedFiles.shareId, shares.id))
    .where(eq(shares.userId, userId))

    return countHistory[0].count;
}