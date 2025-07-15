import type { AuthSession } from "../lib/types.js";
import { auth } from "../lib/auth.js";
import { Hono } from "hono";

const updateRoute = new Hono<AuthSession>();

updateRoute.post("/", async (c) => {
    const user = c.get("user");

    if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { remoteAdress, userAgent } = await c.req.json();

    try {
        if (user.ipAddress !== remoteAdress) {
            await auth.api.updateUser({
                body: {
                    ipAddress: remoteAdress,
                    userAgent: userAgent
                },
                headers: c.req.raw.headers
            })
        }

        return c.json({ message: "User updated" }, 200);
    } catch (error) {
        return c.json({ error: "Failed to update user" }, 500);
    }
});

export default updateRoute;
