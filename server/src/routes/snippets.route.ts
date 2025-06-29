import {
  createSnippetService,
  getSnippetService,
} from "../services/snippet.service.js";
import type { AuthSession } from "../lib/types.ts";
import type { Context } from "hono";
import { Hono } from "hono";
import { createRateLimiter } from "../services/rate-limit.service.js";

const snippetRoute = new Hono<AuthSession>();

snippetRoute.post("/create", createRateLimiter("snippet"), async (c: Context) => {
  const user = c.get("user");

  return await createSnippetService({ c, user });
});

snippetRoute.get("/get/:slug", async (c: Context) => {
  const { slug } = c.req.param();
  return await getSnippetService({ c, slug });
});

export default snippetRoute;
