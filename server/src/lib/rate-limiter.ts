import { RateLimiterRedis } from "rate-limiter-flexible";
import getRedisClient from "./redis";

const rateLimiters: Record<string, RateLimiterRedis> = {}; // prefix -> multiple limiters.

// add prefixes to the rate limiters. Note that the numbers are starting from 0, so 2 is 1 request, etc.

type AuthPrefixes = "upload" | "default" | "check";

const authPrefixes: AuthPrefixes[] = ["upload", "default", "check"];

// Number of requests per time period (5 would equal 4 requests per the duration set below)
const authPrefixesPoints: Record<AuthPrefixes, number> = {
    "upload": 4,
    "default": 4,
    "check": 6,
}

// Duration of the block (rate limiting)
const authPrefixesDuration: Record<AuthPrefixes, number> = {
    "upload": 1800,
    "default": 90,
    "check": 90,
}

export async function getRateLimiter({ keyPrefix }: {keyPrefix: AuthPrefixes}) {
    if (!rateLimiters[keyPrefix]) {
        const redisClient = getRedisClient();
        // ensure Redis is connected before instantiating the limiter
        if (!redisClient.isOpen) {
          await redisClient.connect();
        }

        rateLimiters[keyPrefix] = new RateLimiterRedis({
            storeClient: redisClient,
            useRedisPackage: true,
            points: authPrefixesPoints[keyPrefix],
            duration: authPrefixesDuration[keyPrefix],
            blockDuration: 0,
            keyPrefix: keyPrefix,
        });
    }
    return rateLimiters[keyPrefix];
}

