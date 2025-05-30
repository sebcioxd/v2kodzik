import { Hono } from "hono";
import { AuthSession } from "../lib/auth-types";
import { getConnInfo } from "hono/bun";

const sessionRoute = new Hono<AuthSession>();

sessionRoute.get("/", async (c) => {

  const session = c.get("session")
  const user = c.get("user")

  if (!user) {
    return c.json(null, 401)
  }

  return c.json({session, user}, 200)
})

sessionRoute.get("/version", async (c) => {
  const ipAdress = c.req.header("x-forwarded-for")
  const userAgent = c.req.header("user-agent")

  return c.json({
    bunVersion: Bun.version,
    ipAdress: ipAdress,
    userAgent: userAgent,
  })
})

export default sessionRoute;