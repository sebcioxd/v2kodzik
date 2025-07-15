import { Hono } from "hono";
import { db } from "../db/index";
import { shares } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const lastpostsRoute = new Hono();

lastpostsRoute.get("/", async (c) => {
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
});

export default lastpostsRoute;