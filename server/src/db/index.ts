import { drizzle } from 'drizzle-orm/bun-sql';
import { SQL } from 'bun';
import { DATABASE_URL } from '../lib/env';

const client = new SQL(DATABASE_URL);
export const db = drizzle({ client });
