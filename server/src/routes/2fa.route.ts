import { Hono } from "hono";
import { twoFactor, user } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { createRateLimiter } from "../services/rate-limit.service";
import { trustedDeviceService } from "../services/trustedDevice.service";
import { AuthSession } from "../lib/types";


const twoFactorRoute = new Hono<AuthSession>();
const trustedDevice = new trustedDeviceService();

twoFactorRoute.post("/verify", createRateLimiter("twoFactor"), async (c) => {
    const { token, code, email, rememberDevice }: { token: string, code: string, rememberDevice: boolean, email: string } = await c.req.json()
    const ipAddress = c.req.header("CF-Connecting-IP") || c.req.header("x-forwarded-for") || "127.0.0.1"
    const UA = c.req.header("x-real-user-agent") || c.req.header("User-Agent")

    const data = await db.select().from(twoFactor).where(eq(twoFactor.token, token)).limit(1)
    if (data.length === 0) {
        return c.json({ message: "Invalid token" }, 401)
    }
    
    if (data[0].secret.toString() === code && data[0].expiresAt > new Date())  {
        await db.update(user).set({
            ipAddress: ipAddress,
            userAgent: UA,
        }).where(eq(user.email, email))

        if (rememberDevice) {
            try {
                const deviceResult = await trustedDevice.checkDevice({ 
                    referenceId: data[0].userId, 
                    ipAddress: ipAddress, 
                    userAgent: UA || "Unknown"
                })
        
                if (deviceResult?.isTrusted) {
                    await trustedDevice.extendExpireDateOfDevice({ deviceId: deviceResult.deviceId })
                } else {
                    await trustedDevice.addDevice({
                        referenceId: data[0].userId, 
                        ipAddress: ipAddress, 
                        userAgent: UA || "Unknown"
                    })    
                }
            } catch (err) {
                console.error("Device tracking failed:", err);
            }
            
        }

        if (data[0].cookie) {
            c.header("Set-Cookie", data[0].cookie);
        }

        await db.delete(twoFactor).where(eq(twoFactor.token, token))

        return c.json({ 
            message: "Weryfikacja powiodła się", 
        }, 200)
    }

    return c.json({ message: "Weryfikacja nie powiodła się, token jest nieprawidłowy lub wygasł" }, 400)

});

twoFactorRoute.get("/trusted-devices", async (c) =>{
    const user = c.get("user");

    if (!user) {
        return c.json(null, 401);
    }
    
    const devices = await trustedDevice.listDevices({ referenceId: user.id })

    return c.json({ devices }, 200)
})

twoFactorRoute.post("/trusted-devices/delete/:deviceId", async (c) =>{
    const user = c.get("user");
    const deviceId = c.req.param("deviceId")

    if (!user) {
        return c.json(null, 401);
    }

    try {
        await trustedDevice.removeDevice({ deviceId: deviceId })
    } catch (error) {
        return c.json({ code: "SERVER_ERROR", message: `Nie udało się usunąć urzadzenia o id ${deviceId}` }, 500)
    }

    return c.json({ code: "SUCCESS", message: `Pomyślnie usunięto urządzenie o id ${deviceId}` }, 200)
    

})

export default twoFactorRoute;