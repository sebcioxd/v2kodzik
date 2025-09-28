import { Hono } from "hono";
import { twoFactor, user } from "../db/schema";
import { db } from "../db";
import { eq, sql } from "drizzle-orm";
import { createRateLimiter } from "../services/rate-limit.service";

const twoFactorRoute = new Hono();

twoFactorRoute.post("/verify", createRateLimiter("twoFactor"), async (c) => {
    const { token, code, email, rememberMe } = await c.req.json()
    const ipAddress = c.req.header("CF-Connecting-IP") || c.req.header("x-forwarded-for") || "127.0.0.1"

    const data = await db.select().from(twoFactor).where(eq(twoFactor.token, token)).limit(1)
    if (data.length === 0) {
        return c.json({ message: "Invalid token" }, 401)
    }
    
    if (data[0].secret.toString() === code && data[0].expiresAt > new Date())  {
        await db.update(user).set({
            ipAddress: ipAddress
        }).where(eq(user.email, email))

        return c.json({ message: "Correct token", email: email, rememberMe: rememberMe }, 200)
    }

    return c.json({ message: "The token verification went wrong, was expired or invalid" }, 400)

});


export default twoFactorRoute;