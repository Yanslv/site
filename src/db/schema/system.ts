import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";

// Rate limit persistido em banco (não em memória do processo), pois funções
// serverless na Vercel não compartilham memória entre invocações.
export const rateLimitHits = sqliteTable("rate_limit_hits", {
  key: text("key").primaryKey(),
  windowStart: integer("window_start", { mode: "timestamp" }).notNull(),
  count: integer("count").notNull().default(0),
});

export type RateLimitHit = typeof rateLimitHits.$inferSelect;

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Setting = typeof settings.$inferSelect;

export const siteImages = sqliteTable("site_images", {
  id: text("id").primaryKey(),
  mime: text("mime").notNull(),
  bytes: blob("bytes", { mode: "buffer" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type SiteImage = typeof siteImages.$inferSelect;
