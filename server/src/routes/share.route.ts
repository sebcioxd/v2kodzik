import { Hono } from "hono";
import { db } from "../db";
import { shares, uploadedFiles } from "../db/schema";
import { eq } from "drizzle-orm";
import { getRateLimiter } from "../lib/rate-limiter";
import { getConnInfo } from "hono/bun";
import bcrypt from "bcryptjs";
import {
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
  deleteCookie,
} from 'hono/cookie'

const shareRoute = new Hono();

const verifyCode = async (code: string, shareCode: string) => {
  return await bcrypt.compare(code, shareCode);
};

shareRoute.get("/:slug", async (c) => {
  const { slug } = c.req.param();
  const share = await db.select().from(shares).where(eq(shares.slug, slug));
  if (share.length === 0) {
    return c.json({ message: "Nie znaleziono linku" }, 404);
  }

  // For private shares, only return minimal information until authenticated
  if (share[0].private) {
    return c.json({
      id: share[0].id,
      slug: share[0].slug,
      createdAt: share[0].createdAt,
      expiresAt: share[0].expiresAt,
      private: true,
    });
  }

  // For public shares, return all information as before
  const files = await db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.shareId, share[0].id));

  return c.json({
    id: share[0].id,
    slug: share[0].slug,
    createdAt: share[0].createdAt,
    updatedAt: share[0].updatedAt,
    expiresAt: share[0].expiresAt,
    storagePath: files[0].storagePath,
    files: files,
    totalSize: files.reduce((acc, file) => acc + (file.size || 0), 0),
    private: false,
    
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


  if (!(await verifyCode(accessCode, share[0].code || ""))) {
    return c.json(
      { success: false, message: "Nieprawidłowy kod dostępu", remaining_requests: remaining_requests },
      403
    );
  }

  // After successful verification, fetch and return the file details and set cookie

  setCookie(c, `share_${share[0].id}`, accessCode, {
    path: "/",
    httpOnly: true,
    domain: process.env.NODE_ENV === "production" ? ".dajkodzik.pl" : undefined,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 30 // 30 minutes
  })

  const files = await db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.shareId, share[0].id));

  return c.json({ 
    success: true,
    files: files,
    totalSize: files.reduce((acc, file) => acc + (file.size || 0), 0),
    storagePath: files[0].storagePath
  }, 200);
});

shareRoute.get("/verify-cookie/:slug", async (c) => {
  const { slug } = c.req.param();

  const idToSlug = await db.select().from(shares).where(eq(shares.slug, slug));

  if (idToSlug.length === 0) {
    return c.json({ success: false, message: "Nie znaleziono linku" }, 404);
  }

  const cookieValue = getCookie(c, `share_${idToSlug[0].id}`);

  if (!cookieValue) {
    return c.json({ success: false, message: "Brak ciasteczka" }, 401);
  }

  if (!(await verifyCode(cookieValue, idToSlug[0].code || ""))) {
    deleteCookie(c, `share_${idToSlug[0].id}`);
    return c.json({ success: false, message: "Nieprawidłowy kod dostępu" }, 403);
  }

  const files = await db
  .select()
  .from(uploadedFiles)
  .where(eq(uploadedFiles.shareId, idToSlug[0].id));

  return c.json({ 
    success: true,
    files: files,
    totalSize: files.reduce((acc, file) => acc + (file.size || 0), 0),
    storagePath: files[0].storagePath,
  }, 200);
})

export default shareRoute;
