import {
  createSnippetService,
  getSnippetService,
} from "../services/snippet.service.js";
import type { AuthSession } from "../lib/types.ts";
import type { Context } from "hono";
import { Hono } from "hono";
import { rateLimiterService } from "../services/rate-limit.service.js";

const snippetRoute = new Hono<AuthSession>();

snippetRoute.post("/create", async (c: Context) => {
  const user = c.get("user");

  try {
    await rateLimiterService({
      keyPrefix: "snippet",
      identifier: c.req.header("x-forwarded-for") || "127.0.0.1",
    });
  } catch (error) {
    return c.json(
      {
        message: "Przekroczono limit żądań. Spróbuj ponownie później.",
        error: error,
      },
      429
    );
  }

  return await createSnippetService({ c, user });
});

snippetRoute.get("/get/:slug", async (c: Context) => {
  const { slug } = c.req.param();
  return await getSnippetService({ c, slug });
});

export default snippetRoute;
