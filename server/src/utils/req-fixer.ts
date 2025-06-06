import type { UploadRequestProps, User } from "../lib/types.ts";
import type { Context } from "hono";
import { db } from "../db/index.ts";
import { shares } from "../db/schema.ts";
import { eq } from "drizzle-orm";


const restrictedPaths = ["/upload", "/search", "/faq", "/api", "/admin", "/auth", "/panel", "/success"];

export async function fixRequestProps(req: UploadRequestProps, c: Context, user?: typeof User): Promise<UploadRequestProps | Response> {

    if (req.isPrivate.length === 0 || req.visibility.length === 0 || req.time.length === 0) {
        return c.json({
            message: "Missing required fields",
            receivedFields: {
                isPrivate: req.isPrivate,
                accessCode: req.accessCode,
                visibility: req.visibility,
                time: req.time
            }
        }, 400)
    }

    if (req.isPrivate === "true" && req.accessCode.length === 0) {
        return c.json({
            message: "Access code is required when private is true.",
            receivedFields: {
                isPrivate: req.isPrivate,
                accessCode: req.accessCode
            }
        }, 400)
    }
    

    if (restrictedPaths.includes(req.slug)) {
        return c.json({
            message: "Slug can't be used. It violates our routing rules.",
            receivedSlug: req.slug
        }, 400)
    }
    
    if (!req.slug) {
        req.slug = Math.random().toString(36).substring(2, 8);
    }

    if (req.slug.length < 4 || req.slug.length > 16) {
        return c.json({
            message: "Slug must be between 4 and 16 characters.",
            receivedSlug: req.slug
        }, 400)
    }

    if (req.time !== "24" && req.time !== "168") {
        return c.json({
            message: "Invalid time. It must be either one day or one week.",
            receivedTime: req.time
        }, 400)
    }

    if (req.time === "168" && !user) {
        return c.json({
            message: "You must be logged in to create a one week share.",
            receivedTime: req.time,
            receivedUser: user
        }, 400)
    }

    if (req.isPrivate === "true" && !req.accessCode) {
        return c.json({
            message: "Access code is required when private is true.",
            receivedFields: {
                isPrivate: req.isPrivate,
                accessCode: req.accessCode
            }
        }, 400)
    }

    const checkForShare = await db.select().from(shares).where(eq(shares.slug, req.slug));

    if (checkForShare.length > 0) {
        return c.json({
            message: "Slug already exists",
            receivedSlug: req.slug
        }, 400)
    }

    return req;
    
}
