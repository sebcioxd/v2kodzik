import { createClient } from "redis";
import { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } from "./env.js";

let client: ReturnType<typeof createClient>;

const getRedisClient = () => {
    if (!client) {
        client = createClient({
            username: REDIS_USERNAME,
            password: REDIS_PASSWORD,
            socket: {
                host: REDIS_HOST,
                port: parseInt(REDIS_PORT || "17856"),
            }
        })
        client.on("error", (err) => {
            console.error("Redis client error", err);
            console.log("Please check your Redis configuration.");
            process.exit(1);
        });
        client.connect().catch((err) => {
            console.error("Redis client connection error", err);
            console.log("Please check your Redis configuration.");
            process.exit(1);
        });
    }
    return client;
}

export default getRedisClient;