import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { auth } from "./lib/auth.js";
import { rateLimiterService } from "./services/rate-limit.service.js";

import routes from "./routes/route.js";
import configCors from "./middleware/cors.middleware.js";
import addSession from "./middleware/session.middleware.js";

const app = new Hono();

app.use(logger());
app.use(configCors);
app.use(addSession);

app.on(["POST", "GET"], "/v1/auth/*", async (c) => {
  if (c.req.path.includes("/v1/auth/sign-up/email")) {
    try {
      await rateLimiterService({
        keyPrefix: "auth",
        identifier: c.req.header("x-forwarded-for") || "127.0.0.1",
      });
    } catch (err) {
      return c.json(
        {
          message: "Too many requests. Please try again later.",
          error: err,
        },
        429
      );
    }
  }

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
