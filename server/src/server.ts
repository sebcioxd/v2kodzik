import { Hono } from 'hono'
import routes from './routes'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { SITE_URL } from './lib/env'
import addSession from './middlewares/session.middleware'
import configCors from './middlewares/cors.middleware'
import { auth } from './lib/auth'
const app = new Hono()

app.use('*', logger())
app.use(configCors)
app.use(addSession)

app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

app.route('/v1', routes)

export default {
  port: 8080,
  fetch: app.fetch,
}