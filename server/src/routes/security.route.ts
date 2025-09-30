import { Hono } from "hono";
import { user as userTable, confirm2fa } from "../db/schema";
import { db } from "../db";
import { eq, sql } from "drizzle-orm";
import { createRateLimiter } from "../services/rate-limit.service";
import { AuthSession } from "../lib/types";
import { auth } from "../lib/auth";
import { sendEmailService } from "../services/email.service";


const securityRoute = new Hono<AuthSession>();

securityRoute.post("/twostep", async (c) => {

    const user = c.get("user");

    if (!user) {
        return c.json({ message: "User not found" }, 404)
    }

    if (user.twofactorEnabled) {
        try {
            const confirm2faData = await db.insert(confirm2fa).values({
                userId: user.id,
                token: Bun.randomUUIDv7(),
                type: "disable",
            }).returning();
    
            await sendEmailService({
                to: user.email,
                subject: "Potwierdź swoją tożsamość o wyłączeniu dwuskładnikowej autoryzacji - dajkodzik.pl",
                text: JSON.stringify({
                    text: "Dwuskładnikowa autoryzacja została wyłączona",
                    status: "disabled",
                    token: confirm2faData[0].token
                }),
                emailType: "confirm-2fa"
            });

        } catch (error) {
            return c.json({
                message: "Wystąpił błąd podczas wysyłania e-maila z potwierdzeniem wyłączenia dwuskładnikowej autoryzacji",
                error
            }, 500);
        }
       
        return c.json({ message: "Wysłano e-mail z potwierdzeniem wyłączenia dwuskładnikowej autoryzacji. Przejdz do swojego e-maila po więcej informacji" }, 200)
    } else {
        try {
            const confirm2faData = await db.insert(confirm2fa).values({
                userId: user.id,
                token: Bun.randomUUIDv7(),
                type: "enable",
            }).returning();
    
            await sendEmailService({
                to: user.email,
                subject: "Potwierdź swoją tożsamość o włączeniu dwuskładnikowej autoryzacji - dajkodzik.pl",
                text: JSON.stringify({
                    text: "Prośba o włączenie dwuskładnikowej autoryzacji na twoim koncie",
                    status: "enabled",
                    token: confirm2faData[0].token
                }),
                emailType: "confirm-2fa"
            });

        } catch (error) {
            return c.json({
                message: "Wystąpił błąd podczas wysyłania e-maila z potwierdzeniem włączenia dwuskładnikowej autoryzacji. Przejdz do swojego e-maila po więcej informacji",
                error
            }, 500);
        }
       
        return c.json({ message: "Wysłano e-mail z potwierdzeniem włączenia dwuskładnikowej autoryzacji" }, 200)

    }
});

securityRoute.get("/confirm", async (c) => {

    const user = c.get("user");
    const token = c.req.query("token");

    if (!user) {
        return c.json({ message: "Nie znaleziono użytkownika" }, 404)
    }

    const data = await db.select().from(confirm2fa).where(eq(confirm2fa.token, token as string)).limit(1)

    if (data.length === 0) {
        return c.json({ message: "Nieprawidłowy token" }, 401)
    }
    
    if (data[0].expiresAt < new Date()) {
        return c.json({ message: "Token wygasł" }, 401)
    }

    if (data[0].userId === user.id && data[0].expiresAt > new Date()) {
        if (data[0].type === "enable") {
            await db.update(userTable).set({
                twofactorEnabled: true,
            }).where(eq(userTable.id, user.id))

            await db.delete(confirm2fa).where(eq(confirm2fa.token, token as string))

            return c.json({ message: "Dwuskładnikowa autoryzacja została włączona", type: "enable" }, 200)
        }
    
        if (data[0].type === "disable") {
            await db.update(userTable).set({
                twofactorEnabled: false,
            }).where(eq(userTable.id, user.id))

            await db.delete(confirm2fa).where(eq(confirm2fa.token, token as string))

            return c.json({ message: "Dwuskładnikowa autoryzacja została wyłączona", type: "disable" }, 200)
        }
    }
    
    
    

});

export default securityRoute;