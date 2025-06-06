import type { RateLimiterServiceResult } from "../lib/types.js";
import { RateLimiterRedis } from "rate-limiter-flexible";
import getRedisClient from "../lib/redis.js";

const rateLimiters: Record<string, RateLimiterRedis> = {}; // prefix -> multiple limiters.

// add prefixes to the rate limiters. Note that the numbers are starting from 0, so 2 is 1 request, etc.

type AuthPrefixes = "upload" | "default" | "check" | "auth";

// Number of requests per time period (5 would equal 4 requests per the duration set below)
const authPrefixesPoints: Record<AuthPrefixes, number> = {
    "upload": 3,
    "default": 4,
    "check": 6,
    "auth": 3,
}

// Duration of the block (rate limiting)
const authPrefixesDuration: Record<AuthPrefixes, number> = {
    "upload": 1800,
    "default": 25,
    "check": 90,
    "auth": 900,
}

export async function rateLimiterService({ keyPrefix, identifier }: { keyPrefix: AuthPrefixes, identifier: string }) {
    const redisClient = getRedisClient();
    
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }

    if (!rateLimiters[keyPrefix]) {
        rateLimiters[keyPrefix] = new RateLimiterRedis({
            storeClient: redisClient,
            useRedisPackage: true,
            points: authPrefixesPoints[keyPrefix],
            duration: authPrefixesDuration[keyPrefix],
            blockDuration: 0,
            keyPrefix: keyPrefix,
        });
    }

    try {
        const result: RateLimiterServiceResult = await rateLimiters[keyPrefix].consume(identifier);
        return result;
    } finally {
        await redisClient.quit();
    }
}