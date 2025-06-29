import type { AuthSession, RateLimiterError, RateLimitResponse } from "../lib/types.ts";
import type { Context } from "hono";
import { finalizeUploadService, S3UploadService, cancelUploadService } from "../services/upload.service.js";
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
        const rateLimitError = error as RateLimiterError;
        const isFirstExceed = rateLimitError.consumedPoints === 3;
        
        return c.json({
            message: isFirstExceed 
                ? "Osiągnięto limit żądań. Kolejne próby będą blokowane przez 30 minut."
                : "Przekroczono limit żądań. Spróbuj ponownie później.",
            error: rateLimitError
        }, 429);
    }
});


uploadRoute.post("/finalize", async (c: Context) => {
    const user = c.get("user");
    return await finalizeUploadService({ c, user });
});

uploadRoute.get("/cancel/:slug", async (c: Context) => {
    const { slug } = c.req.param();

    return await cancelUploadService({ c, slug });
});

export default uploadRoute;