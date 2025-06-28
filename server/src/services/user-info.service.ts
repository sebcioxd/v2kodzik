import type { GetUserHistoryServiceProps, GetUserHistoryCountServiceProps } from "../lib/types.js";
import { shares, snippets } from "../db/schema.js";
import { db } from "../db/index.js";
import { eq, desc } from "drizzle-orm";



export async function getUserHistoryService({ offset, limit, userId }: GetUserHistoryServiceProps) {
    const history = await db
        .select()
        .from(shares)
        .where(eq(shares.userId, userId))
        .orderBy(desc(shares.createdAt))
        .limit(limit)
        .offset(offset);

    return history;
}

export async function getUserHistoryCountService({ userId }: GetUserHistoryCountServiceProps) {
    const distinctShares = await db
        .selectDistinct({ id: shares.id })
        .from(shares)
        .where(eq(shares.userId, userId));

    const uniqueCount = distinctShares.length;

    return uniqueCount;
}