import { RateLimiterRedis } from "rate-limiter-flexible";
import getRedisClient from "../lib/redis.ts";
const rateLimiters = {}; // prefix -> multiple limiters.
// Number of requests per time period (5 would equal 4 requests per the duration set below)
const authPrefixesPoints = {
    "upload": 3,
    "default": 4,
    "check": 6,
    "auth": 3,
};
// Duration of the block (rate limiting)
const authPrefixesDuration = {
    "upload": 1800,
    "default": 25,
    "check": 90,
    "auth": 900,
};
export async function rateLimiterService({ keyPrefix, identifier }) {
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
        const result = await rateLimiters[keyPrefix].consume(identifier);
        return result;
    }
    finally {
        await redisClient.quit();
    }
}
