import type { AuthSession } from "../lib/types.ts";
import type { Context } from "hono";
import { finalizeUploadService, S3UploadService } from "../services/upload.service.js";
import { rateLimiterService } from "../services/rate-limit.service.js";
import { Hono } from "hono";

const uploadRoute = new Hono<AuthSession>();

uploadRoute.post("/presign", async (c: Context) => {
    const user = c.get("user");

    try {
        await rateLimiterService({
            keyPrefix: "upload",
            identifier: c.req.header("x-forwarded-for") || "127.0.0.1",
        });
        
        return await S3UploadService({ c, user });
    } catch (error) {
        return c.json({
            message: "Przekroczono limit żądań. Spróbuj ponownie później.",
            error: error
        }, 429)
    }
});


uploadRoute.post("/finalize", async (c: Context) => {
    return await finalizeUploadService({ c });
});

export default uploadRoute;