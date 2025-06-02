import { Hono } from "hono";
import { db } from "../db";
import { shares, uploadedFiles } from "../db/schema";
import { eq } from "drizzle-orm";
import { getRateLimiter } from "../lib/rate-limiter";
import { Context } from "hono";
import bcrypt from "bcryptjs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_REGION } from "../lib/env";

const uploadRoute = new Hono();

const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: MINIO_REGION,
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY
  },
  forcePathStyle: true 
});

const hashCode = async (code: string) => {
  return await bcrypt.hash(code, 10);
};

uploadRoute.post("/", async (c: Context) => {
  const ipAdress = c.req.header("x-forwarded-for") || "127.0.0.1"
  const user = c.get("user");
  const userAgent = c.req.header("user-agent")

  const limiter = await getRateLimiter({ keyPrefix: "upload" });

  try {
    await limiter.consume(ipAdress || "127.0.0.1");

  } catch (error) {
    return c.json({ message: "Przekroczyłeś limit wysyłania plików" }, 429);
  }

  const formData = await c.req.formData();
  const files = formData.getAll("files") as File[];
  let slug = formData.get("slug") as string;
  const isPrivate = formData.get("isPrivate") as string;
  const accessCode = formData.get("accessCode") as string;
  const visibility = formData.get("visibility") as string;
  const time = formData.get("time") as string;
  slug = slug.replace(/\s+/g, ""); // clean slug from any whitespaces

  // check for restricted paths
  const restrictedPaths = [
    "/upload",
    "/search",
    "/faq",
    "/api",
    "/admin",
    "/auth",
    "/panel",
    "/success",
  ];
  if (restrictedPaths.some((path) => slug === path.replace("/", ""))) {
    return c.json(
      { message: "nazwa linku jest zarezerwowana dla systemu" },
      400
    );
  }

  if (!slug) {
    // if no slug generate a random slug to 6 characters
    slug = Math.random().toString(36).substring(2, 8);
  }

  if (time !== "24" && time !== "168") {
    return c.json({ message: "nieprawidłowy czas" }, 400);
  }

  if (slug.length < 4 || slug.length > 16) {
    return c.json(
      { message: "nazwa linku musi mieć przynajmniej 4 znaki i maksymalnie 16 znaków" },
      400
    );
  }

  if (!files || files.length === 0) {
    return c.json({ message: "nie wybrano plików" }, 400);
  }

  if (isPrivate === "true" && !accessCode) {
    return c.json(
      { message: "kod dostępu jest wymagany dla plików prywatnych" },
      400
    );
  }

  // check if file names have any special characters
  const specialChars = /[(){}[\]!@#$%^&*+=\\|<>?,;:'"]/; // blocks parentheses and other special characters
  if (files.some((file) => specialChars.test(file.name))) {
    return c.json(
      {
        message:
          "nazwa pliku nie może zawierać znaków specjalnych jak nawiasy () i inne",
      },
      400
    );
  }

  // check if slug is already in use
  const existingShare = await db
    .select()
    .from(shares)
    .where(eq(shares.slug, slug));
  if (existingShare.length > 0) {
    return c.json({ message: "nazwa linku jest już zajęta" }, 409);
  }

  try {
    const chunkSize = 3;
    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (file: File) => {
          const buffer = await file.arrayBuffer();
          await s3Client.send(new PutObjectCommand({
            Bucket: 'sharesbucket',
            Key: `${slug}/${file.name}`,
            Body: Buffer.from(buffer),
            ContentLength: file.size,
            ContentType: file.type || 'application/octet-stream'
          }));
        })
      );
    }

    const [shareResult] = await db
      .insert(shares)
      .values({
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + (time === "24" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)), 
        userId: user ? user.id : null,
        private: isPrivate === "true",
        code: accessCode ? await hashCode(accessCode) : null,
        visibility: visibility === "true",
        ipAddress: ipAdress,
        userAgent: userAgent
      })
      .returning({ id: shares.id });

    await Promise.all(
      files.map(async (file: File) => {
        await db.insert(uploadedFiles).values({
          shareId: shareResult.id,
          fileName: file.name,
          size: file.size,
          storagePath: `${slug}/${file.name}`,
        });
      })
    );

    return c.json({ message: "Pliki wysłane pomyślnie", slug: slug, time: time }, 200);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ message: error.message }, 500);
    }
    return c.json({ message: "Wystąpił błąd podczas wysyłania plików" }, 500);
  }
});

export default uploadRoute;