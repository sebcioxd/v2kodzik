import type { SetOAuthStatusServiceProps } from "../lib/types";
import { auth } from "../lib/auth";
import { db } from "../db/index";
import { account } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Context } from "hono";

export async function setOAuthStatusService({ c, user }: SetOAuthStatusServiceProps) {
    try {
        const accounts = await auth.api.listUserAccounts({
            headers: c.req.raw.headers
        })

        const hasPassword = accounts.find((account) => account.provider === "credential");
        
        if (hasPassword) {
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
    
    if (accountInfo.password || accountInfo.providerId === "credential") {
        await auth.api.updateUser({
            body: {
                oauth: false,
            },
            headers: c.req.raw.headers
        })
        return c.json({ message: "Konto ma już ustawione hasło lub jest powiązane z OAuth" }, 400);
    }

    try {
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
    } catch (error) {
        return c.json({ message: "Wystąpił błąd podczas ustawiania hasła", error: error instanceof Error ? error.message : String(error) }, 500);
    }
}


// To jest przykłądowa funkcja do pobierania guildów z Discorda
// Nie jest ona w jakikolwiek sposób używana w projekcie (oprócz testów)
export async function getDiscordGuildsService({ c }: { c: Context }) {
    try {
        const accounts = await auth.api.listUserAccounts({
            headers: c.req.raw.headers
        })

        const acc = accounts.find((account) => account.provider === "discord");

       const accessToken = await auth.api.getAccessToken({
        body: {
            providerId: "discord",
            accountId: acc?.id,
        },
        headers: c.req.raw.headers
       })

       const guilds = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: {
            Authorization: `Bearer ${accessToken.accessToken}`
        }
       })

       const guildsData = await guilds.json();

       return c.json({ guilds: guildsData }, 200);
    } catch (error) {
        return c.json({ message: "Wystąpił błąd podczas pobierania guildów", error: error instanceof Error ? error.message : String(error) }, 500);
    }
}

