import { sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, uuid, boolean, index } from 'drizzle-orm/pg-core';

export const shares = pgTable('shares', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').$defaultFn(() => sql`NOW()`).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => sql`NOW()`).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  private: boolean('private').default(false),
  code: text('code'),
  visibility: boolean('visibility').default(true),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
}, (t) => [
  index('idx_shares_visibility_created')
    .on(t.visibility, t.createdAt.desc()),
  index('idx_shares_user_created')
    .on(t.userId, t.createdAt.desc()),
  index('idx_shares_expires_at')
    .on(t.expiresAt),
  index('idx_shares_slug_code')
    .on(t.slug, t.code),
  index('idx_shares_slug_private')
    .on(t.slug, t.private),
]);

export const uploadedFiles = pgTable('uploaded_files', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  shareId: uuid('share_id').references(() => shares.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  size: integer('size').notNull(),
  storagePath: text('storage_path').notNull(),
  contentType: text('content_type').notNull().default('application/octet-stream'),
  lastModified: text('last_modified'),
  createdAt: timestamp('created_at').$defaultFn(() => sql`NOW()`).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => sql`NOW()`).notNull(),
}, (t) => [
  index('idx_uploaded_files_share_id')
    .on(t.shareId),
  index('idx_uploaded_files_storage_path')
    .on(t.storagePath),
  index('idx_uploaded_files_share_created')
    .on(t.shareId, t.createdAt.desc()),
  index('idx_uploaded_files_share_size')
    .on(t.shareId, t.size),
]);

export const snippets = pgTable('snippets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').$defaultFn(() => sql`NOW()`).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => sql`NOW()`).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  code: text('code'),
  language: text('language'),
});

export const signatures = pgTable('signatures', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  signature: text('signature').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => sql`NOW()`).notNull(),
  expiresAt: timestamp('expires_at').$defaultFn(() => sql`NOW() + INTERVAL '5 minutes'`).notNull(),
}, (t) => [
  index('idx_signatures_signature').on(t.signature),
]);

export const cancelSignatures = pgTable('cancel_signatures', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  signature: text('signature').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => sql`NOW()`).notNull(),
  expiresAt: timestamp('expires_at').$defaultFn(() => sql`NOW() + INTERVAL '5 minutes'`).notNull(),
  slug: text('slug').notNull(),
}, (t) => [
  index('idx_cancel_signatures_signature').on(t.signature),
]);

export const monthlyLimits = pgTable('monthly_limits', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  megabytesUsed: integer('megabytes_used').notNull().default(0),
  megabytesLimit: integer('megabytes_limit').notNull().default(1000),
  resetAt: timestamp('reset_at').notNull().default(sql`NOW() + INTERVAL '1 month'`),
}, (t) => [
  index('idx_monthly_limits_user_id')
    .on(t.userId),
  index('idx_monthly_limits_reset_at')
    .on(t.resetAt),
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  oauth: boolean("oauth"),
}, (t) => [
  index("idx_user_emails").on(t.email),
]);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}, (t) => [
  index("idx_session_user_id").on(t.userId),
  index("idx_session_token").on(t.token),
]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
}, (t) => [
  index("idx_account_user_id").on(t.userId),
]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
}, (t) => [
  index("idx_verification_identifier").on(t.identifier),
]);


  
export const schema = { user, session, account, verification, shares, uploadedFiles, snippets };