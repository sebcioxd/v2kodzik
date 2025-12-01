import { sql, relations } from 'drizzle-orm';
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
  views: integer('views').default(0),
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
  downloadCount: integer('download_count').default(0),
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
  linksGenerated: integer('links_generated').notNull().default(0),
  filesUploaded: integer('files_uploaded').notNull().default(0),
  lifetimeMegabytesUsed: integer('lifetime_megabytes_used').notNull().default(0),
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
  stripeCustomerId: text("stripe_customer_id"),
  userAgent: text('user_agent'),
  oauth: boolean("oauth").default(false),
  twofactorEnabled: boolean("twofactor_enabled").default(true),
  isFlagged: boolean("is_flagged").default(false),
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

export const trustedDevice = pgTable("trusted_device", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  expiresAt: timestamp('expires_at').notNull().default(sql`NOW() + INTERVAL '1 month'`),
  createdAt: timestamp('created_at').$defaultFn(() => sql`NOW()`).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});


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

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  plan: text("plan").notNull(),
  referenceId: text("reference_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").default("incomplete"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end"),
  seats: integer("seats"),
});

export const monthlyIPlimits = pgTable("monthly_ip_limits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: text("ip_address").notNull(),
  megabytesUsed: integer("megabytes_used").notNull().default(0),
  megabytesLimit: integer("megabytes_limit").notNull().default(500),
  resetAt: timestamp("reset_at").notNull().default(sql`NOW() + INTERVAL '1 month'`),
}, (t) => [
  index("idx_monthly_ip_limits_ip_address").on(t.ipAddress),
  index("idx_monthly_ip_limits_reset_at").on(t.resetAt),
]);

export const sharesHistory = pgTable('shares_history', {
  id: text("id").primaryKey(),
  slug: text('slug').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => sql`NOW()`).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => sql`NOW()`).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  private: boolean('private').default(false),
  code: text('code'),
  visibility: boolean('visibility').default(true),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  views: integer('views').default(0),
}, (t) => [
  index('idx_shares_h_visibility_created')
    .on(t.visibility, t.createdAt.desc()),
  index('idx_shares_h_user_created')
    .on(t.userId, t.createdAt.desc()),
  index('idx_shares_h_expires_at')
    .on(t.expiresAt),
  index('idx_shares_h_slug_code')
    .on(t.slug, t.code),
  index('idx_shares_h_slug_private')
    .on(t.slug, t.private),
]);


export const twoFactor = pgTable("two_factor", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  secret: integer("secret").notNull(),
  token: text("token").notNull(),
  cookie: text("cookie").notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => sql`NOW()`).notNull(),
  expiresAt: timestamp('expires_at').notNull().default(sql`NOW() + INTERVAL '10 minutes'`),
}, (t) => [
  index("idx_two_factor_user_id").on(t.userId),
]);

export const confirm2fa = pgTable("confirm_2fa", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => sql`NOW()`).notNull(),
  expiresAt: timestamp('expires_at').notNull().default(sql`NOW() + INTERVAL '30 minutes'`),
  type: text("type").notNull(),
}, (t) => [
  index("idx_confirm_2fa_user_id").on(t.userId),
  index("idx_confirm_2fa_token").on(t.token),
]);

export const sharesRelations = relations(shares, ({ one, many }) => ({
  user: one(user, {
    fields: [shares.userId],
    references: [user.id],
  }),
  uploadedFiles: many(uploadedFiles),
}));

export const uploadedFilesRelations = relations(uploadedFiles, ({ one }) => ({
  share: one(shares, {
    fields: [uploadedFiles.shareId],
    references: [shares.id],
  }),
}));

export const snippetsRelations = relations(snippets, ({ one }) => ({
  user: one(user, {
    fields: [snippets.userId],
    references: [user.id],
  }),
}));

export const monthlyLimitsRelations = relations(monthlyLimits, ({ one }) => ({
  user: one(user, {
    fields: [monthlyLimits.userId],
    references: [user.id],
  }),
}));

export const sharesHistoryRelations = relations(sharesHistory, ({ one }) => ({
  user: one(user, {
    fields: [sharesHistory.userId],
    references: [user.id],
  }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

export const confirm2faRelations = relations(confirm2fa, ({ one }) => ({
  user: one(user, {
    fields: [confirm2fa.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));


export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  shares: many(shares),
  snippets: many(snippets),
  monthlyLimits: many(monthlyLimits),
  sharesHistory: many(sharesHistory),
  twoFactor: many(twoFactor),
  confirm2fa: many(confirm2fa),
}));


  
export const schema = { user, session, account, verification, shares, uploadedFiles, snippets, subscription, monthlyLimits, monthlyIPlimits, twoFactor, confirm2fa, userRelations, sessionRelations, accountRelations, monthlyLimitsRelations, sharesHistoryRelations, twoFactorRelations, confirm2faRelations };