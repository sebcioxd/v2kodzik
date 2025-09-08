import type { GetUserHistoryServiceProps, GetUserHistoryCountServiceProps } from "../lib/types";
import { sharesHistory, snippets } from "../db/schema";
import { db } from "../db/index";
import { eq, desc } from "drizzle-orm";

export async function getUserHistoryService({ offset, limit, userId }: GetUserHistoryServiceProps) {
    const history = await db
        .select()
        .from(sharesHistory)
        .where(eq(sharesHistory.userId, userId))
        .orderBy(desc(sharesHistory.createdAt))
        .limit(limit)
        .offset(offset);    

    return history;
}

export async function getUserHistoryCountService({ userId }: GetUserHistoryCountServiceProps) {
    const distinctShares = await db
        .selectDistinct({ id: sharesHistory.id })
        .from(sharesHistory)
        .where(eq(sharesHistory.userId, userId));

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