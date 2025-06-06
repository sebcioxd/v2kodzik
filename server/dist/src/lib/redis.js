import { createClient } from "redis";
import { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } from "./env.ts";
let client;
const getRedisClient = () => {
    if (!client) {
        client = createClient({
            username: REDIS_USERNAME,
            password: REDIS_PASSWORD,
            socket: {
                host: REDIS_HOST,
                port: parseInt(REDIS_PORT || "17856"),
            }
        });
        client.on("error", (err) => {
            console.error("Redis client error", err);
        });
        client.connect().catch((err) => {
            console.error("Redis client connection error", err);
        });
    }
    return client;
};
export default getRedisClient;
