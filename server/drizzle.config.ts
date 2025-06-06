import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./src/lib/env.ts";

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: DATABASE_URL,
      },
})