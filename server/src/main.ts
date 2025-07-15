import { Hono } from 'hono'
import { logger } from "hono/logger";
import { auth } from "./lib/auth";
import routes from "./routes/route";
import configCors from "./middleware/cors.middleware";
import addSession from "./middleware/session.middleware";
import { createRateLimiter } from "./services/rate-limit.service";

const app = new Hono();

app.use(logger());
app.use(configCors);
app.use(addSession);

app.on(["POST", "GET"], "/v1/auth/sign-up/email", createRateLimiter("auth"), async (c) => {
  return await auth.handler(c.req.raw);
});

app.on(["POST", "GET"], "/v1/auth/forget-password", createRateLimiter("forget"), async (c) => {
  return await auth.handler(c.req.raw);
});

app.on(["POST", "GET"], "/v1/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Obsługa błędów
app.onError((err, c) => {
  console.log("Wystąpił bład z serwerem. Więcej detali: ", err);
  console.error(err);
  return c.json({ error: "Wystąpił bład z serwerem. Więcej detali: " + err }, 500);
});

app.route("/v1", routes);

export default {
  port: 8080,
  fetch: app.fetch,
}
