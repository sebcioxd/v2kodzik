import { getShareFileService, verifyCookieService, verifyShareCodeService } from "../services/share.service.js";
import { createRateLimiter } from "../services/rate-limit.service.js";
import { Hono } from "hono";

const shareRoute = new Hono();

shareRoute.get("/verify", createRateLimiter("check"), async (c) => {
    const slug = c.req.query("slug");
    const code = c.req.query("accessCode");

    if (!slug || !code) {
        return c.json({ error: "Slug and code are required" }, 400);
    }

    const share = await verifyShareCodeService({
        code,
        slug,
        c
    });

    return share;
});


shareRoute.get("/verify-cookie/:slug", async (c) => {
    const slug = c.req.param("slug");

    const share = await verifyCookieService({
        c,
        slug
    });

    return share;
});

shareRoute.get("/:slug", async (c) => {
    const slug = c.req.param("slug");

    const share = await getShareFileService({ 
        slug, 
        c 
    });

    return share;
});

export default shareRoute;