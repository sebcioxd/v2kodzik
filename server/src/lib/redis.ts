import { createClient } from "redis";
import { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } from "./env";


export class Redis {
    private constructor() {}

    public static async getClient() {
        return createClient({
            username: REDIS_USERNAME,
            password: REDIS_PASSWORD,
            socket: {
                host: REDIS_HOST,
                port: parseInt(REDIS_PORT || "17856"),
            }
        });
    }
}
