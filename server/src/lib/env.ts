import { config } from 'dotenv';

config({ path: '.env' });

export const DATABASE_URL = process.env.DATABASE_URL!;
export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const SITE_URL = process.env.SITE_URL!;
export const CRON_BODY_KEY = process.env.CRON_BODY_KEY!;
export const REDIS_HOST = process.env.REDIS_HOST!;
export const REDIS_PORT = process.env.REDIS_PORT!;
export const REDIS_USERNAME = process.env.REDIS_USERNAME!;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD!;
export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET!;
export const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL!;
export const DOMAIN_WILDCARD = process.env.DOMAIN_WILDCARD!;
export const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT!;
export const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY!;
export const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY!;
export const MINIO_REGION = process.env.MINIO_REGION!;
