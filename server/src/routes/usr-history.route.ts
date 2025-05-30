import { Hono } from "hono";
import { AuthSession } from "../lib/auth-types";
import { uploadedFiles, shares } from "../db/schema";
import { eq, desc, count } from "drizzle-orm";
import { db } from "../db";

const usrHistoryRoute = new Hono<AuthSession>();

usrHistoryRoute.get("/", async (c) => {
  const user = c.get("user")
  if (!user) {
    return c.json(null, 401)
  }

  const page = Number(c.req.query('page')) || 1
  const limit = Number(c.req.query('limit')) || 4
  const offset = (page - 1) * limit
  

  const history = await db
    .select()
    .from(uploadedFiles)
    .fullJoin(shares, eq(uploadedFiles.shareId, shares.id))
    .where(eq(shares.userId, user.id))
    .orderBy(desc(uploadedFiles.createdAt))
    .limit(limit)
    .offset(offset)

  return c.json({history, user}, 200)
})

usrHistoryRoute.get("/count", async (c) => {

  const user = c.get("user")

  if (!user) {
    return c.json(null, 401)
  }

  const history = await db
    .select({ count: count() })
    .from(shares)
    .where(eq(shares.userId, user.id))

  return c.json({count: history[0].count}, 200)
})


export default usrHistoryRoute;