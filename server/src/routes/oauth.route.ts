import type { AuthSession } from "../lib/types.js";
import { Hono } from "hono";
import { addOAuthAccountPasswordService, getDiscordGuildsService, setOAuthStatusService } from "../services/oauth.service.js";

const oauthRoute = new Hono<AuthSession>();

oauthRoute.post("/set", async (c) => {
    const user = c.get("user");

    if (!user) {
        return c.json(null, 401);
    }

    return await setOAuthStatusService({ c, user });
});

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