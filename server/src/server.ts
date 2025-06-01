import { Hono } from 'hono'
import routes from './routes'
import { logger } from 'hono/logger'
import addSession from './middlewares/session.middleware'
import configCors from './middlewares/cors.middleware'
import { getRateLimiter } from "./lib/rate-limiter";
import { auth } from './lib/auth'
const app = new Hono()

app.use('*', logger())
app.use(configCors)
app.use(addSession)

app.on(["POST", "GET"], "/api/auth/*", async (c) => {

  if (c.req.path.includes("/api/auth/sign-up/email")) {
    const limiter = await getRateLimiter({ keyPrefix: "auth" });
    const ipAdress = c.req.header("x-forwarded-for") || "127.0.0.1"

    try {
      await limiter.consume(ipAdress);
    } catch (error) {
      return c.json({ message: "Przekroczyłeś limit rejestracji" }, 429);
    }
  }

	return auth.handler(c.req.raw);
});

app.route('/v1', routes)

export default {
  port: 8080,
  fetch: app.fetch,
}