import type { AuthSession } from "../lib/types";
import type { Context } from "hono";
import { UploadService } from "../services/upload.service";
import { createRateLimiter } from "../services/rate-limit.service";
import { Hono } from "hono";
import { zValidator } from '@hono/zod-validator';
import { uploadQuerySchema, uploadBodySchema, finalizeSchema } from "../lib/zod";

const uploadRoute = new Hono<AuthSession>();
const uploadService = new UploadService("sharesbucket");

uploadRoute.post("/presign",
zValidator("query", uploadQuerySchema), 
zValidator("json", uploadBodySchema), 
createRateLimiter("upload"),
async (c) => {
    
    const user = c.get("user");
    const queryData = c.req.valid('query');
    const bodyData = c.req.valid('json');
    
    return await uploadService.uploadFiles({ c, user, queryData, bodyData });
});

uploadRoute.post("/finalize", 
createRateLimiter("finalize"), 
zValidator("json", finalizeSchema),
async (c) => {

    const user = c.get("user");
    const body = c.req.valid('json');

    return await uploadService.finalizeUpload({ c, user, body });
});

uploadRoute.get("/cancel/:slug", async (c: Context) => {
    const { slug } = c.req.param();

    return await uploadService.cancelUpload({ c, slug });
});


export default uploadRoute;