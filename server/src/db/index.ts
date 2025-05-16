import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DATABASE_URL } from '../lib/env';

const client = postgres(DATABASE_URL);

export const db = drizzle({ client });
