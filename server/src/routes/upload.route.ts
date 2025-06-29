import type { AuthSession } from "../lib/types.ts";
import type { Context } from "hono";
import { finalizeUploadService, S3UploadService, cancelUploadService } from "../services/upload.service.js";
import { createRateLimiter } from "../services/rate-limit.service.js";
import { Hono } from "hono";

const uploadRoute = new Hono<AuthSession>();

uploadRoute.post("/presign", createRateLimiter("upload"), async (c: Context) => {
    const user = c.get("user");

    return await S3UploadService({ c, user });
   
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