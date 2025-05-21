import { Hono } from "hono";
import { db } from "../db";
import { shares, uploadedFiles } from "../db/schema";
import { eq } from "drizzle-orm";
import { getRateLimiter } from "../lib/rate-limiter";
import { getConnInfo } from "hono/bun";
const shareRoute = new Hono();

shareRoute.get("/:slug", async (c) => {
  const { slug } = c.req.param();
  const share = await db.select().from(shares).where(eq(shares.slug, slug));
  if (share.length === 0) {
    return c.json({ message: "Nie znaleziono linku" }, 404);
  }

  const files = await db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.shareId, share[0].id));

  return c.json({
    id: share[0].id,
    slug: share[0].slug,
    createdAt: share[0].createdAt,
    updatedAt: share[0].updatedAt,
    storagePath: files[0].storagePath,
    files: files,
    totalSize: files.reduce((acc, file) => acc + (file.size || 0), 0),
    private: share[0].private,
  });
});

// Add verification endpoint
shareRoute.post("/verify", async (c) => {
  const connInfo = getConnInfo(c);

  const limiter = await getRateLimiter({ keyPrefix: "check" });

  let remaining_requests = 0;

  try {
    const rlRes = await limiter.consume(connInfo.remote.address || "127.0.0.1");
    remaining_requests = rlRes.remainingPoints;
    if (rlRes.remainingPoints <= 0) {
      return c.json({ message: "Przekroczyłeś limit weryfikacji kodu. Odczekaj chwilę i spróbuj ponownie." }, 429);
    }
  } catch (error) {
    return c.json({ message: "Przekroczyłeś limit weryfikacji kodu. Odczekaj chwilę i spróbuj ponownie." }, 429);
  }

  const { slug, accessCode } = await c.req.json();

  if (!slug || !accessCode) {
    return c.json({ success: false, message: "Brak wymaganych danych" }, 400);
  }

  const share = await db.select().from(shares).where(eq(shares.slug, slug));

  if (share.length === 0) {
    return c.json({ success: false, message: "Nie znaleziono linku" }, 404);
  }

  if (!share[0].private) {
    return c.json({ success: true }, 200);
  }

  if (share[0].code !== accessCode) {
    return c.json(
      { success: false, message: "Nieprawidłowy kod dostępu" },
      403
    );
  }

  return c.json({ success: true }, 200);
});

export default shareRoute;
