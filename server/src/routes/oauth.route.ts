import type { AuthSession } from "../lib/types";
import { Hono } from "hono";
import { addOAuthAccountPasswordService, getDiscordGuildsService } from "../services/oauth.service";
import { multiAccountService } from "../services/multiaccounts.service";

const oauthRoute = new Hono<AuthSession>();

oauthRoute.post("/password-update", async (c) => {
    const user = c.get("user")
    
    if (!user) {
      return c.json(null, 401)
    }
  
    return await addOAuthAccountPasswordService({ c, user });   
});

oauthRoute.get("/discord-guilds", async (c) => {
    const user = c.get("user")
    
    if (!user) {
        return c.json(null, 401)
    }

    return await getDiscordGuildsService({ c });
});

oauthRoute.get("/multi-accounts", async (c) => {

    const ipAddress = c.req.header("CF-Connecting-IP") || c.req.header("x-forwarded-for") || "127.0.0.1";
    const multiAccService = new multiAccountService()

    const accounts = await multiAccService.getUserAccounts({ ipAddress: ipAddress })




    return c.json(accounts);
});


export default oauthRoute;