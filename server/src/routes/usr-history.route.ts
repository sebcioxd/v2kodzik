import { Hono } from "hono";
import { AuthSession } from "../lib/auth-types";
import { uploadedFiles, shares } from "../db/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

const usrHistoryRoute = new Hono<AuthSession>();

usrHistoryRoute.get("/", async (c) => {

  const user = c.get("user")

  if (!user) {
    return c.json(null, 401)
  }

  const history = await db
    .select()
    .from(uploadedFiles)
    .fullJoin(shares, eq(uploadedFiles.shareId, shares.id))
    .where(eq(shares.userId, user.id))

  return c.json({history, user}, 200)
})


export default usrHistoryRoute;