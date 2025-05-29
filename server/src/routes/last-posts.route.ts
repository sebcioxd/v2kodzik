import { Hono } from "hono";
import { uploadedFiles, shares } from "../db/schema";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";

const lastPostsRoute = new Hono();

lastPostsRoute.get("/", async (c) => {

  const posts = await db
    .select({
      id: shares.id,
      slug: shares.slug,
      createdAt: shares.createdAt,
      expiresAt: shares.expiresAt,
      private: shares.private,
    })
    .from(shares)
    .where(eq(shares.visibility, true))
    .orderBy(desc(shares.createdAt))
    .limit(3)

  return c.json({posts, count: posts.length}, 200)
})


export default lastPostsRoute;