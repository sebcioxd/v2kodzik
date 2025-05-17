import { Hono } from "hono";
import { db } from "../db";
import { shares } from "../db/schema";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_BODY_KEY } from "../lib/env";
const cronRoute = new Hono();

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

cronRoute.post("/", async (c) => {
    const body = await c.req.json();
    if (body.key !== CRON_BODY_KEY) {
        return c.json({ message: "Nieprawidłowy klucz" }, 401);
    }
    const { data: folders, error: foldersError } = await supabase.storage
    .from("sharebucket")
    .list("", { limit: 100, offset: 0 });

    if (foldersError) {
        return c.json({ message: foldersError }, 404);
    } 
  const slugs = await db.select().from(shares); 

  // remove the folders, which are not in the slugs
  const foldersToDelete = folders.filter((folder) => !slugs.some((slug) => slug.slug === folder.name));

  // loop through the files in the folder and delete them
  for (const folder of foldersToDelete) {
    const { data: files, error: filesError } = await supabase.storage.from("sharebucket").list(folder.name);
    if (files) {
      const { error } = await supabase.storage.from("sharebucket").remove(files.map((file) => `${folder.name}/${file.name}`));
      if (error) {
        return c.json({ message: error }, 404);
      } else {
        return c.json({ message: "Pomyślnie usunięto pliki" }, 200);
      }
    }
  }

  return c.json({ message: "Udało się sprawdzić foldery" }, 200);
  
});

export default cronRoute;