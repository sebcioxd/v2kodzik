import { drizzle } from 'drizzle-orm/bun-sql';
import { DATABASE_URL } from '../lib/env';

export const db = drizzle(DATABASE_URL)