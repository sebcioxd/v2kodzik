import type { GetUserHistoryServiceProps, GetUserHistoryCountServiceProps } from "../lib/types";
import { shares, snippets } from "../db/schema";
import { db } from "../db/index";
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


export async function getUserSnippetsService({ offset, limit, userId }: GetUserHistoryServiceProps) {
    const history = await db
        .select()
        .from(snippets)
        .where(eq(snippets.userId, userId))
        .orderBy(desc(snippets.createdAt))
        .limit(limit)
        .offset(offset);

    return history;
}

export async function getUserSnippetsCountService({ userId }: GetUserHistoryCountServiceProps) {
    const distinctShares = await db
        .selectDistinct({ id: snippets.id })
        .from(snippets)
        .where(eq(snippets.userId, userId));

    const uniqueCount = distinctShares.length;

    return uniqueCount;
}