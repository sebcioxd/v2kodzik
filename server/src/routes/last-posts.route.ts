import { Hono } from "hono";
import { uploadedFiles, shares } from "../db/schema";
import { desc } from "drizzle-orm";
import { db } from "../db";

const lastPostsRoute = new Hono();

lastPostsRoute.get("/", async (c) => {

  const posts = await db
    .select()
    .from(shares)
    .orderBy(desc(shares.createdAt))
    .limit(3)

  return c.json({posts}, 200)
})


export default lastPostsRoute;