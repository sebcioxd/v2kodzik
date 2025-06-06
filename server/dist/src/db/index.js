import { drizzle } from 'drizzle-orm/node-postgres';
import { DATABASE_URL } from '../lib/env.ts';
export const db = drizzle(DATABASE_URL);
