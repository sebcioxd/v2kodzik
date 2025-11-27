import { drizzle } from 'drizzle-orm/bun-sql';
import { SQL } from 'bun';
import { DATABASE_URL } from '../lib/env';
import * as schema from './schema';

const client = new SQL(DATABASE_URL);
export const db = drizzle({ client, schema });
