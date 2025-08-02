import { db } from "../db/index";
import { monthlyLimits } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Context } from "hono";
import { User } from "../lib/types";

export class MonthlyUsageService {
    constructor() {}

    async getMonthlyLimits({ c, user }: { c: Context, user: typeof User | null }) {
        if (!user) {
            return c.json({
                message: "Użytkownik nie jest zalogowany",
                success: false, 
            }, 401);
        }

        const limits = await db.select().from(monthlyLimits).where(eq(monthlyLimits.userId, user.id));
 
        if (!limits || limits.length === 0) {
            await db.insert(monthlyLimits).values({
                userId: user.id,
                megabytesUsed: 0,
                megabytesLimit: 1000,
            });

            return c.json({
                message: "Limit miesięczny został utworzony",
                success: true,
                megabytesUsed: 0,
                megabytesLimit: 1000,
            });
        }

        return c.json({
            message: "Limit miesięczny został pobrany",
            success: true,
            megabytesUsed: limits[0].megabytesUsed,
            megabytesLimit: limits[0].megabytesLimit,
        });
    }

    async updateMonthlyLimits({ c, user, megabytesUsed }: { c: Context, user: typeof User, megabytesUsed: number }) {

    const limits = await db.select().from(monthlyLimits).where(eq(monthlyLimits.userId, user.id));

    if (!limits || limits.length === 0) {
        await db.insert(monthlyLimits).values({
            userId: user.id,
            megabytesUsed: megabytesUsed,
            megabytesLimit: 1000,
        });

        return c.json({
            message: "Limit miesięczny został utworzony",
            success: true,
            megabytesUsed: megabytesUsed,
            megabytesLimit: 1000,
        });
    }

    if (limits[0].megabytesUsed === 0) {
        await db.update(monthlyLimits).set({
            megabytesUsed: megabytesUsed,
            resetAt: sql`NOW() + INTERVAL '1 month'`,
        }).where(eq(monthlyLimits.userId, user.id));

        return c.json({
            message: "Limit miesięczny został zaktualizowany",
            success: true,
            megabytesUsed: megabytesUsed + limits[0].megabytesUsed,
            megabytesLimit: limits[0].megabytesLimit,
        });
    }

    if (limits[0].megabytesUsed + megabytesUsed > limits[0].megabytesLimit) {
        return c.json({
            message: "Limit miesięczny został przekroczony",
            success: false,
            hasReachedLimit: true,
        }, 400);
    }

    await db.update(monthlyLimits).set({
        megabytesUsed: megabytesUsed + limits[0].megabytesUsed,
    }).where(eq(monthlyLimits.userId, user.id));

    return c.json({
        message: "Limit miesięczny został zaktualizowany",
        success: true,
        megabytesUsed: megabytesUsed + limits[0].megabytesUsed,
        megabytesLimit: limits[0].megabytesLimit,
    });
    }

    async increaseMonthlyLimits({ referenceId, megabytesToAdd }: { referenceId: string, megabytesToAdd: number }) {  
        const limits = await db.select().from(monthlyLimits).where(eq(monthlyLimits.userId, referenceId));

        await db.update(monthlyLimits).set({
            megabytesLimit: limits[0].megabytesLimit + megabytesToAdd,
        }).where(eq(monthlyLimits.userId, referenceId));
    }

    async decreaseMonthlyLimits({ referenceId, megabytesToSubtract }: { referenceId: string, megabytesToSubtract: number }) {
        const limits = await db.select().from(monthlyLimits).where(eq(monthlyLimits.userId, referenceId));

        await db.update(monthlyLimits).set({
            megabytesLimit: limits[0].megabytesLimit - megabytesToSubtract,
        }).where(eq(monthlyLimits.userId, referenceId));
    }
}