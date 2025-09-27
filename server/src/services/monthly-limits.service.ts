import { db } from "../db/index";
import { monthlyLimits, monthlyIPlimits, user } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Context } from "hono";
import { User } from "../lib/types";

export class MonthlyUsageService {
    constructor() {}

    private DEFAULT_USER_LIMIT: number = 1000;

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
                megabytesLimit: this.DEFAULT_USER_LIMIT,
            });

            return c.json({
                message: "Limit miesięczny został utworzony",
                success: true,
                megabytesUsed: 0,
                megabytesLimit: this.DEFAULT_USER_LIMIT,
                lifetimeMegabytesUsed: 0,
            });
        }

        return c.json({
            message: "Limit miesięczny został pobrany",
            success: true,
            megabytesUsed: limits[0].megabytesUsed,
            megabytesLimit: limits[0].megabytesLimit,
            linksGenerated: limits[0].linksGenerated,
            filesUploaded: limits[0].filesUploaded,
            lifetimeMegabytesUsed: limits[0].lifetimeMegabytesUsed,
            resetAt: limits[0].resetAt,
        });
    }

    async updateMonthlyLimits({ c, user, megabytesUsed, filesUploaded }: { c: Context, user: typeof User, megabytesUsed: number, filesUploaded: number }) {

    const limits = await db.select().from(monthlyLimits).where(eq(monthlyLimits.userId, user.id));

    if (!limits || limits.length === 0) {
       await db.insert(monthlyLimits).values({
            userId: user.id,
            megabytesUsed: megabytesUsed,
            lifetimeMegabytesUsed: megabytesUsed + limits[0].lifetimeMegabytesUsed,
            filesUploaded: filesUploaded,
            linksGenerated: 1 + limits[0].linksGenerated,
            megabytesLimit: this.DEFAULT_USER_LIMIT,
        });

        return c.json({
            message: "Limit miesięczny został utworzony",
            success: true,
            megabytesUsed: megabytesUsed,
            lifetimeMegabytesUsed: megabytesUsed,
            filesUploaded: filesUploaded,
            linksGenerated: 1 + limits[0].linksGenerated,
            megabytesLimit: this.DEFAULT_USER_LIMIT,
        });
    }

    if (limits[0].megabytesUsed === 0) {
        await db.update(monthlyLimits).set({
            megabytesUsed: megabytesUsed,
            lifetimeMegabytesUsed: megabytesUsed + limits[0].lifetimeMegabytesUsed,
            filesUploaded: filesUploaded,
            linksGenerated: 1 + limits[0].linksGenerated,
            resetAt: sql`NOW() + INTERVAL '1 month'`,
        }).where(eq(monthlyLimits.userId, user.id));

        return c.json({
            message: "Limit miesięczny został zaktualizowany",
            success: true,
            megabytesUsed: megabytesUsed + limits[0].megabytesUsed,
            lifetimeMegabytesUsed: megabytesUsed + limits[0].lifetimeMegabytesUsed,
            filesUploaded: filesUploaded + limits[0].filesUploaded,
            linksGenerated: 1 + limits[0].linksGenerated,
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
        lifetimeMegabytesUsed: megabytesUsed + limits[0].lifetimeMegabytesUsed,
        filesUploaded: filesUploaded + limits[0].filesUploaded,
        linksGenerated: 1 + limits[0].linksGenerated,
    }).where(eq(monthlyLimits.userId, user.id));

    return c.json({
        message: "Limit miesięczny został zaktualizowany",
        success: true,
        megabytesUsed: megabytesUsed + limits[0].megabytesUsed,
        filesUploaded: filesUploaded + limits[0].filesUploaded,
        lifetimeMegabytesUsed: megabytesUsed + limits[0].lifetimeMegabytesUsed,
        linksGenerated: 1 + limits[0].linksGenerated,
        megabytesLimit: limits[0].megabytesLimit,
    });
    }

    async increaseMonthlyLimits({ referenceId, megabytesToAdd }: { referenceId: string, megabytesToAdd: number }) {  
        await db.update(monthlyLimits).set({
            megabytesLimit: megabytesToAdd,
        }).where(eq(monthlyLimits.userId, referenceId));
    }

    async resetMonthlyLimits({ referenceId }: { referenceId: string }) {
        await db.update(monthlyLimits).set({
            megabytesLimit: 1000,
        }).where(eq(monthlyLimits.userId, referenceId));
    }
}

export class MonthlyIPLimitsService {
    constructor() {}

    private DEFAULT_IP_LIMIT: number = 500;

    async getMonthlyLimits({ c, ipAddress }: { c: Context, ipAddress: string }) {

        const limits = await db.select().from(monthlyIPlimits).where(eq(monthlyIPlimits.ipAddress, ipAddress));
 
        if (!limits || limits.length === 0) {
            await db.insert(monthlyIPlimits).values({
                ipAddress: ipAddress,
                megabytesUsed: 0,
                megabytesLimit: this.DEFAULT_IP_LIMIT,
            });

            return c.json({
                message: "Limit IP miesięczny został utworzony",
                success: true,
                megabytesUsed: 0,
                megabytesLimit: this.DEFAULT_IP_LIMIT,
            });
        }

        return c.json({
            message: "Limit IP miesięczny został pobrany",
            success: true,
            megabytesUsed: limits[0].megabytesUsed,
            megabytesLimit: limits[0].megabytesLimit,
            resetAt: limits[0].resetAt,
        });
    }

    async updateMonthlyLimits({ c, ipAddress, megabytesUsed }: { c: Context, ipAddress: string, megabytesUsed: number }) {

        const limits = await db.select().from(monthlyIPlimits).where(eq(monthlyIPlimits.ipAddress, ipAddress));
    
        if (!limits || limits.length === 0) {
            await db.insert(monthlyIPlimits).values({
                ipAddress: ipAddress,
                megabytesUsed: megabytesUsed,
                megabytesLimit: this.DEFAULT_IP_LIMIT,
            });
    
            return c.json({
                message: "Limit IP miesięczny został utworzony",
                success: true,
                megabytesUsed: megabytesUsed,
                megabytesLimit: this.DEFAULT_IP_LIMIT,
            });
        }
    
        if (limits[0].megabytesUsed === 0) {
            await db.update(monthlyIPlimits).set({
                megabytesUsed: megabytesUsed,
                resetAt: sql`NOW() + INTERVAL '1 month'`,
            }).where(eq(monthlyIPlimits.ipAddress, ipAddress));
    
            return c.json({
                message: "Limit IP miesięczny został zaktualizowany",
                success: true,
                megabytesUsed: megabytesUsed + limits[0].megabytesUsed,
                megabytesLimit: limits[0].megabytesLimit,
            });
        }
    
        if (limits[0].megabytesUsed + megabytesUsed > limits[0].megabytesLimit) {
            return c.json({
                message: "Limit IP miesięczny został przekroczony",
                success: false,
                hasReachedLimit: true,
            }, 400);
        }
    
        await db.update(monthlyIPlimits).set({
            megabytesUsed: megabytesUsed + limits[0].megabytesUsed,
        }).where(eq(monthlyIPlimits.ipAddress, ipAddress));
    
        return c.json({
            message: "Limit IP miesięczny został zaktualizowany",
            success: true,
            megabytesUsed: megabytesUsed + limits[0].megabytesUsed,
            megabytesLimit: limits[0].megabytesLimit,
        });
        }
}