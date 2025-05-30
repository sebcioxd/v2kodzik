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
  const ipAdress = getConnInfo(c)
  const userAgent = c.req.raw.headers.get("user-agent")

  return c.json({
    bunVersion: Bun.version,
    ipAdress: ipAdress.remote.address,
    ipPort: ipAdress.remote.port,
    ipType: ipAdress.remote.addressType,
    userAgent: userAgent,
  })
})

export default sessionRoute;