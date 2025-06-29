import type { Store } from "hono-rate-limiter";
import { rateLimiter } from "hono-rate-limiter";
import { RedisStore } from "rate-limit-redis";
import getRedisClient from "../lib/redis.js";


const rateLimitConfigs = {
    upload: {
        windowMs: 30 * 60 * 1000,  // 30 minut
        limit: 2,
    },
    default: {
        windowMs: 25 * 1000,     
        limit: 3,
    },
    check: {
        windowMs: 60000,      
        limit: 5,
    },
    auth: {
        windowMs: 15 * 60 * 1000, 
        limit: 2,
    },
    download: {
        windowMs: 60000,  
        limit: 6,
    },
    snippet: {
        windowMs: 250 * 1000,     
        limit: 4,
    },
    forget: {
        windowMs: 15 * 60 * 1000,
        limit: 3,
    }
} as const;

type RateLimitKey = keyof typeof rateLimitConfigs;

const redisClient = getRedisClient();

export function createRateLimiter(key: RateLimitKey) {
    const config = rateLimitConfigs[key];
    
    return rateLimiter({
        windowMs: config.windowMs,
        limit: config.limit,
        keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "127.0.0.1",
        store: new RedisStore({
            sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        }) as unknown as Store,
    });
}