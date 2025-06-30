import type { SetOAuthStatusServiceProps } from "../lib/types.js";
import { auth } from "../lib/auth.js";
import { db } from "../db/index.js";
import { account } from "../db/schema.js";
import { eq } from "drizzle-orm";


export async function setOAuthStatusService({ c, user }: SetOAuthStatusServiceProps) {
    try {
        const userId = user.id;
        const [accountInfo] = await db.select().from(account).where(eq(account.userId, userId));
        
        if (accountInfo.password || accountInfo.providerId === "credential") {
            await auth.api.updateUser({
                body: {
                    oauth: false,
                },
                headers: c.req.raw.headers
            })
            return c.json({ message: "Konto ma już ustawione hasło lub jest powiązane z OAuth" }, 400);
        }

        await auth.api.updateUser({
            body: {
                oauth: true,
            },
            headers: c.req.raw.headers
        })

        return c.json({ message: "Status zaktualizowany" }, 200);

    } catch (error) {
        return c.json({ 
            message: "Wystąpił błąd podczas ustawiania statusu OAuth", 
            error: error instanceof Error ? error.message : String(error) 
        }, 500);
    }
}

export async function addOAuthAccountPasswordService({ c, user }: SetOAuthStatusServiceProps) {
    const userId = user.id;
    const [accountInfo] = await db.select().from(account).where(eq(account.userId, userId));

    const { password } = await c.req.json();
    
    if (accountInfo.providerId === "credential") {
        return c.json({ message: "Konto nie jest powiązane z OAuth" }, 400);
    }

    if (accountInfo.password) {
        return c.json({ message: "Konto ma już ustawione hasło" }, 400);
    }

    await auth.api.setPassword({
        body: { newPassword: password },
        headers: c.req.raw.headers
    });

    await auth.api.updateUser({
        body: {
            oauth: false,
        },
        headers: c.req.raw.headers
    })

    return c.json({ message: "Hasło zaktualizowane" }, 200);
}

