import { config } from "dotenv"

config({ path: ".env" })

export const DATABASE_URL = process.env.DATABASE_URL!
export const TEST = process.env.TEST!
export const SMTP_USER = process.env.SMTP_USER!
export const SMTP_PASS = process.env.SMTP_PASS!
export const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL!
export const SITE_URL = process.env.SITE_URL!
export const DOMAIN_WILDCARD = process.env.DOMAIN_WILDCARD!
export const REDIS_HOST = process.env.REDIS_HOST!
export const REDIS_PORT = process.env.REDIS_PORT!
export const REDIS_USERNAME = process.env.REDIS_USERNAME!
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD!
export const ENVIRONMENT = process.env.ENVIRONMENT!
export const S3_ENDPOINT = process.env.S3_ENDPOINT!
export const S3_REGION = process.env.S3_REGION!
export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY!
export const S3_SECRET_KEY = process.env.S3_SECRET_KEY!
export const CRON_BODY_KEY = process.env.CRON_BODY_KEY!;