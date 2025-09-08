import type { AuthSession } from "../lib/types";
import { Hono } from "hono";
import { getUserHistoryService, getUserHistoryCountService, getUserSnippetsService, getUserSnippetsCountService } from "../services/user-info.service";

const historyRoute = new Hono<AuthSession>();

historyRoute.get("/", async (c) => {
    const user = c.get("user");

    if (!user) {
        return c.json(null, 401);
    }

    const page = Number(c.req.query("page"));
    const limit = Number(c.req.query("limit"));
    const offset = (page - 1) * limit;

    const history = await getUserHistoryService({ offset, limit, userId: user.id });


    return c.json({ history }, 200)
});

historyRoute.get("/count", async (c) => {
    const user = c.get("user")
    
    if (!user) {
      return c.json(null, 401)
    }
  
    const count = await getUserHistoryCountService({ userId: user.id });

    return c.json({count}, 200)
});

historyRoute.get("/snippets", async (c) => {
    const user = c.get("user");

    if (!user) {
        return c.json(null, 401);
    }

    const page = Number(c.req.query("page"));
    const limit = Number(c.req.query("limit"));
    const offset = (page - 1) * limit;

    const snippets = await getUserSnippetsService({ offset, limit, userId: user.id });

    return c.json({ snippets }, 200);
});

historyRoute.get("/snippets/count", async (c) => {
    const user = c.get("user");

    if (!user) {
        return c.json(null, 401);
    }

    const count = await getUserSnippetsCountService({ userId: user.id });

    return c.json({ count }, 200);
});

export default historyRoute;