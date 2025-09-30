import { Hono } from "hono";
import { user } from "../db/schema";
import { db } from "../db";
import { eq, sql } from "drizzle-orm";
import { createRateLimiter } from "../services/rate-limit.service";
import { AuthSession } from "../lib/types";
import { auth } from "../lib/auth";
import crypto from "node:crypto"


const securityRoute = new Hono<AuthSession>();

securityRoute.post("/twostep", async (c) => {

    const user = c.get("user");

    if (!user) {
        return c.json({ message: "User not found" }, 404)
    }

    if (user.twofactorEnabled) {
        await auth.api.updateUser({
            body: {
                twofactorEnabled: false,
            },
            headers: c.req.raw.headers
        })
        return c.json({ message: "Dwuskładnikowa autoryzacja została wyłączona" }, 200)
    }
    
    await auth.api.updateUser({
        body: {
            twofactorEnabled: true,
        },
        headers: c.req.raw.headers
    })
    return c.json({ message: "Dwuskładnikowa autoryzacja została włączona" }, 200)
});

export default securityRoute;