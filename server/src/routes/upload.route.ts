import type { AuthSession } from "../lib/types";
import type { Context } from "hono";
import { UploadService } from "../services/upload.service";
import { createRateLimiter } from "../services/rate-limit.service";
import { Hono } from "hono";

const uploadRoute = new Hono<AuthSession>();
const uploadService = new UploadService("sharesbucket");

uploadRoute.post("/presign", createRateLimiter("upload"), async (c: Context) => {
    const user = c.get("user");
    return await uploadService.uploadFiles({ c, user });
});

uploadRoute.post("/finalize", async (c: Context) => {
    const user = c.get("user");
    return await uploadService.finalizeUpload({ c, user });
});

uploadRoute.get("/cancel/:slug", async (c: Context) => {
    const { slug } = c.req.param();

    return await uploadService.cancelUpload({ c, slug });
});

export default uploadRoute;