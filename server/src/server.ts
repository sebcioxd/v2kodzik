import { Hono } from 'hono'
import routes from './routes'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { SITE_URL } from './lib/env'
const app = new Hono()

app.use('*', logger())
app.use(
	"*", 
	cors({
		origin: SITE_URL,
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.route('/v1', routes)

export default {
  port: 8080,
  fetch: app.fetch,
}