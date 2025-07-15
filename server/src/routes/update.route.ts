import type { AuthSession } from "../lib/types";
import { auth } from "../lib/auth";
import { Hono } from "hono";

const updateRoute = new Hono<AuthSession>();

updateRoute.post("/", async (c) => {
    const user = c.get("user");

    if (!user) {
        return c.json({ error: "Nie jesteś zalogowany" }, 401);
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

        return c.json({ message: "Użytkownik zaktualizowany" }, 200);
    } catch (error) {
        return c.json({ error: "Nie udało się zaktualizować użytkownika" }, 500);
    }
});

export default updateRoute;
