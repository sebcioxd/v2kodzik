import { createClient } from "redis";
import { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } from "./env";

let client: ReturnType<typeof createClient>;

const getRedisClient = () => {
    if (!client) {
        client = createClient({
            username: REDIS_USERNAME,
            password: REDIS_PASSWORD,
            socket: {
                host: REDIS_HOST,
                port: parseInt(REDIS_PORT || "17856"),
                connectTimeout: 5000,
                socketTimeout: 5000,
            }
        })
        client.on("error", (err) => {
            process.exit(1);
        });
        client.connect().catch((err) => {
            process.exit(1);
        });
    }
    return client;
}

export default getRedisClient;