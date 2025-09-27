import type { AuthSession } from "../lib/types";
import { Hono } from "hono";
import { addOAuthAccountPasswordService, getDiscordGuildsService } from "../services/oauth.service";

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

export default oauthRoute;