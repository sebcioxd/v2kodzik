import type { Store } from "hono-rate-limiter";
import { rateLimiter } from "hono-rate-limiter";
import { RedisStore } from "rate-limit-redis";
import getRedisClient from "../lib/redis.js";


const minutes = (ms: number) => Math.floor(ms / 1000 / 60);

export const rateLimitConfigs = {
    upload: {
        windowMs: minutes(20), 
        limit: 3,
    },
    default: {
        windowMs: minutes(25),     
        limit: 3,
    },
    check: {
        windowMs: minutes(1),      
        limit: 5,
    },
    auth: { // rejestracja
        windowMs: minutes(10), 
        limit: 2,
    },
    download: {
        windowMs: minutes(3),  
        limit: 8,
    },
    snippet: {
        windowMs: minutes(5),     
        limit: 5,
    },
    forget: {
        windowMs: minutes(10),
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
        keyGenerator: (c) => {
            const ip = c.req.header("CF-Connecting-IP") ?? "127.0.0.1";
            return `${key}:${ip}`;
        },
        store: new RedisStore({
            sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        }) as unknown as Store,
    });
}