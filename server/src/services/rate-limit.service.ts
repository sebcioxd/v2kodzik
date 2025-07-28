import type { Store } from "hono-rate-limiter";
import { rateLimiter } from "hono-rate-limiter";
import { RedisStore } from "rate-limit-redis";
import { Redis } from "../lib/redis";

const minutes = (min: number) => min * 60 * 1000;

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
    auth: {
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
    },
    finalize: {
        windowMs: minutes(20),
        limit: 3,
    }
} as const;

type RateLimitKey = keyof typeof rateLimitConfigs;



export function createRateLimiter(key: RateLimitKey) {
    return async (c: any, next: any) => {
        const config = rateLimitConfigs[key];
        const redisClient = await Redis.getClient();
       
        try {
            await redisClient.connect();

            const limiter = rateLimiter({
                windowMs: config.windowMs,
                limit: config.limit,
                keyGenerator: (c) => {
                    const ip = c.req.header("CF-Connecting-IP") || c.req.header("x-forwarded-for") || "127.0.0.1";
                    return `${key}:${ip}`;
                },
                store: new RedisStore({
                    sendCommand: (...args: string[]) => {
                        const [command, ...commandArgs] = args;
                        return redisClient.send(command, commandArgs);
                    },
                }) as unknown as Store,
            }); 
           
            return await limiter(c, next);
        } finally {
            redisClient.close(); 
        }
    };
}