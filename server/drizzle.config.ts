import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./src/lib/env";

// for bun to push use:
// bunx --bun drizzle-kit push

// for studio 
// bunx drizzle-kit studio

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!, // can't use DATABASE_URL cuz it's not defined in bun
      },
})