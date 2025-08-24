import type { AuthSession } from "../lib/types";
import type { Context } from "hono";
import { UploadService } from "../services/upload.service";
import { createRateLimiter } from "../services/rate-limit.service";
import { Hono } from "hono";
import { zValidator } from '@hono/zod-validator';
import { uploadBodySchema, finalizeSchema, cancelBodySchema } from "../lib/zod";

const uploadRoute = new Hono<AuthSession>();
const uploadService = new UploadService("sharesbucket");

uploadRoute.post("/presign",
zValidator("json", uploadBodySchema), 
createRateLimiter("upload"),
async (c) => {
    
    const user = c.get("user");
    const bodyData = c.req.valid('json');
    
    return await uploadService.uploadFiles({ c, user, bodyData });
});

uploadRoute.post("/finalize", 
zValidator("json", finalizeSchema),
createRateLimiter("finalize"),
async (c) => {

    const user = c.get("user");
    const body = c.req.valid('json');

    return await uploadService.finalizeUpload({ c, user, body });
});

uploadRoute.post("/cancel/:slug",
zValidator("json", cancelBodySchema),
createRateLimiter("cancel"),
async (c) => {
    const { slug } = c.req.param();
    const body = c.req.valid('json');

    return await uploadService.cancelUpload({ c, slug, body });
});


export default uploadRoute;