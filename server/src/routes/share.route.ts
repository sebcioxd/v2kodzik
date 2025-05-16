import { Hono } from "hono";
import { db } from "../db";
import { shares, uploadedFiles } from "../db/schema";
import { eq } from "drizzle-orm";
const shareRoute = new Hono();


shareRoute.get("/:slug", async (c) => {
  const { slug } = c.req.param();
  const share = await db.select().from(shares).where(eq(shares.slug, slug));
  if (share.length === 0) {
    return c.json({ message: "Nie znaleziono linku" }, 404);
  }

  const files = await db.select().from(uploadedFiles).where(eq(uploadedFiles.shareId, share[0].id));
  
  return c.json({
    id: share[0].id,
    slug: share[0].slug,
    createdAt: share[0].createdAt,
    updatedAt: share[0].updatedAt,
    storagePath: files[0].storagePath,
    files: files,
    totalSize: files.reduce((acc, file) => acc + (file.size || 0), 0)
  });
});

export default shareRoute;