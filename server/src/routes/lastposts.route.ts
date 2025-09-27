import { Hono } from "hono";
import { db } from "../db/index";
import { shares, snippets } from "../db/schema";
import { eq, desc } from "drizzle-orm";

const lastpostsRoute = new Hono();

lastpostsRoute.get("/", async (c) => {
  const [posts, snippetsPosts] = await Promise.all([
    db
      .select({
        id: shares.id,
        slug: shares.slug,
        createdAt: shares.createdAt,
        expiresAt: shares.expiresAt,
        private: shares.private,
        views: shares.views,
      })
      .from(shares)
      .where(eq(shares.visibility, true))
      .orderBy(desc(shares.createdAt))
      .limit(3),
    db
      .select({
        id: snippets.id,
        slug: snippets.slug,
        createdAt: snippets.createdAt,
        expiresAt: snippets.expiresAt,
        language: snippets.language,
      })
      .from(snippets)
      .orderBy(desc(snippets.createdAt))
      .limit(3),
  ]);

  const mergedPosts = [
    ...posts.map((post) => ({ ...post, type: "post" })),
    ...snippetsPosts.map((snippet) => ({ ...snippet, type: "snippet", language: snippet.language })),
  ];

  const sortedResponse = mergedPosts
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  return c.json(
    {
      posts: sortedResponse,
      count: sortedResponse.length,
    },
    200
  );
});

export default lastpostsRoute;
