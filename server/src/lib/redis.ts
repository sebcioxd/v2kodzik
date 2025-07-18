import { RedisClient } from "bun";
import { REDIS_URL } from "./env";

export class Redis {
    private constructor() {}

    public static async getClient() {
       return new RedisClient(REDIS_URL, {
        idleTimeout: 30000,
       });
    }
}
