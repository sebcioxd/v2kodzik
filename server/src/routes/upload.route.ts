import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "../lib/env";
import { db } from "../db";
import { shares, uploadedFiles } from "../db/schema";
import { eq } from "drizzle-orm";
const uploadRoute = new Hono();

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

uploadRoute.post("/", async (c) => {
  const formData = await c.req.formData();
  const files = formData.getAll("files") as File[];
  let slug = formData.get("slug") as string;
  slug = slug.replace(/\s+/g, ''); // clean slug from any whitespaces

  // check for restricted paths
  const restrictedPaths = ['/upload', '/search', '/faq', '/api', '/admin'];
  if (restrictedPaths.some(path => slug === path.replace('/', ''))) {
    return c.json({ message: "nazwa linku jest zarezerwowana dla systemu" }, 400);
  }

  if (!slug) {
    // if no slug generate a random slug to 6 characters
    slug = Math.random().toString(36).substring(2, 8);
  }

  if (slug.length < 4) {
    return c.json({ message: "nazwa linku musi mieć przynajmniej 4 znaki" }, 400);
  }

  if (!files || files.length === 0) {
    return c.json({ message: "nie wybrano plików" }, 400);
  }

  // check if slug is already in use
  const existingShare = await db.select().from(shares).where(eq(shares.slug, slug));
  if (existingShare.length > 0) {
    return c.json({ message: "nazwa linku jest już zajęta" }, 409);
  }


  // upload files to supabase storage in chunks to improve performance
  try {
    const chunkSize = 3;
    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (file: File) => {
          const { error } = await supabase.storage
            .from("sharebucket")
            .upload(file.name ? `${slug}/${file.name}` : "unknown", file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type || undefined
            });
          if (error) throw error;
        })
      );
    }

    const [shareResult] = await db.insert(shares).values({
      slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({ id: shares.id });

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

    return c.json({ message: "Pliki wysłane pomyślnie", slug: slug }, 200);
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error) {
      return c.json({ message: error.message }, 500);
    }
    return c.json({ message: "Wystąpił błąd podczas wysyłania plików" }, 500);
  }
});

export default uploadRoute;