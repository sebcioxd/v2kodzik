import { defineConfig } from 'drizzle-kit';
import { DATABASE_URL } from './src/lib/env';

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './supabase/migrations',
    dialect: 'postgresql',
    dbCredentials: {
      url: DATABASE_URL,
    },
  });