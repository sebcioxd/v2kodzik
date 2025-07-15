import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./src/lib/env.ts";

// for pnpm to push use:
// pnpm exec drizzle-kit push or pnpm dlx drizzle-kit push

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: DATABASE_URL,
      },
})