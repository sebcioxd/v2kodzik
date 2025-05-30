import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "../lib/env";
import { Data } from "hono/dist/types/context";
import JSZip from 'jszip';

const downloadRoute = new Hono();

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

downloadRoute.post("/", async (c) => {
  const { path } = await c.req.json();
  const { data, error } = await supabase.storage.from('sharebucket').download(path);
  if (error) {
    return c.json({ message: error }, 404);
  }
  c.header("Content-Type", "application/octet-stream");
  c.header("Content-Disposition", "attachment");

  return c.body(data as unknown as Data);
});

downloadRoute.post("/bulk", async (c) => {
  const { paths } = await c.req.json();
  const zip = new JSZip();
  
  try {
    const filePromises = paths.map(async (path: string) => {
      const { data, error } = await supabase.storage.from('sharebucket').download(path);
      if (error) throw error;

      const arrayBuffer = await (data as Blob).arrayBuffer();
      const fileName = path.split('/').pop() || 'unknown';
      zip.file(fileName, arrayBuffer);
    });

    await Promise.all(filePromises);

    const zipContent = await zip.generateAsync({ type: "blob" });
    
    c.header("Content-Type", "application/zip");
    c.header("Content-Disposition", `attachment; filename=kodzik.zip`);
    
    return c.body(zipContent as unknown as Data);
  } catch (error) {
    console.error('Bulk download error:', error);
    return c.json({ message: "Wystąpił błąd podczas tworzenia pliku zip" }, 500);
  }
});


export default downloadRoute;