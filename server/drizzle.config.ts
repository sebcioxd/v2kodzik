import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./src/lib/env";

// for bun to push use:
// bunx drizzle-kit push

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: DATABASE_URL,
      },
})