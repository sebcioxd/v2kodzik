import { drizzle } from 'drizzle-orm/bun-sql';
import { SQL } from 'bun';
import { DATABASE_URL } from '../lib/env';

const client = new SQL({
    url: DATABASE_URL,
    max: 1,
    idleTimeout: 30,
    maxLifetime: 0,
    connectionTimeout: 30,
});

export const db = drizzle({ client });