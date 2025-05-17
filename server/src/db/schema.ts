import { sql } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const shares = pgTable('shares', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const uploadedFiles = pgTable('uploaded_files', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  shareId: uuid('share_id').references(() => shares.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  size: integer('size').notNull(),
  storagePath: text('storage_path').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
