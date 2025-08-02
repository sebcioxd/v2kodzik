import type { AuthSession } from "../lib/types";
import { Hono } from "hono";
import { MonthlyUsageService } from "../services/monthly-limits.service";

const limitsRoute = new Hono<AuthSession>();
const usage = new MonthlyUsageService();

limitsRoute.get("/check", async (c) => {
    const user = c.get("user");

    if (!user) {
        return c.json(null, 401);
    }

    return await usage.getMonthlyLimits({ c, user });
});

export default limitsRoute;