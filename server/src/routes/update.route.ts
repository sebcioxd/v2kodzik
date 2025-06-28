import type { AuthSession } from "../lib/types.js";
import { Hono } from "hono";
import { user } from "../db/schema.js";
import { db } from "../db/index.js";
import { eq } from "drizzle-orm";

const updateRoute = new Hono<AuthSession>();

updateRoute.post("/", async (c) => {
    const userInfo = c.get("user");
    
    const { remoteAdress, userAgent } = await c.req.json();

    if (!userInfo) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    try {
        if (user.ipAddress !== remoteAdress) {
            await db.update(user).set({
                ipAddress: remoteAdress,
                userAgent: userAgent,
            }).where(eq(user.id, userInfo.id));
        }

        return c.json({ message: "User updated" }, 200);
    } catch (error) {
        return c.json({ error: "Failed to update user" }, 500);
    }
});

export default updateRoute;
