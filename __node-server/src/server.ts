import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { auth } from "./lib/auth.js";
import routes from "./routes/route.js";
import configCors from "./middleware/cors.middleware.js";
import addSession from "./middleware/session.middleware.js";
import { createRateLimiter } from "./services/rate-limit.service.js";

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

app.route("/v1", routes);

serve(
  {
    fetch: app.fetch,
    port: 8080,
  },
  (info) => {
    console.log(`Server is running on port ${info.port}`);
  }
);
