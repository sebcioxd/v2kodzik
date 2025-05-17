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
  const deletionResults = [];
  for (const folder of foldersToDelete) {
    const { data: files, error: filesError } = await supabase.storage.from("sharebucket").list(folder.name);
    if (files) {
      const { error } = await supabase.storage.from("sharebucket").remove(files.map((file) => `${folder.name}/${file.name}`));
      
      // Instead of returning immediately, track the result
      if (error) {
        deletionResults.push({ folder: folder.name, success: false, error });
      } else {
        // After deleting files, we also need to delete the empty folder
        const { error: folderError } = await supabase.storage.from("sharebucket").remove([`${folder.name}/`]);
        deletionResults.push({ 
          folder: folder.name, 
          success: !folderError, 
          error: folderError 
        });
      }
    }
  }

  return c.json({ 
    message: "Operacja zakończona", 
    deletedFolders: deletionResults,
    totalProcessed: foldersToDelete.length
  }, 200);
  
});

export default cronRoute;