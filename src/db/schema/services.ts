import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const services = sqliteTable(
  "services",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),
    durationMinutes: integer("duration_minutes").notNull(),
    priceCents: integer("price_cents").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    imagePath: text("image_path"),
    color: text("color").notNull().default("#B86F78"),
    sortOrder: integer("sort_order").notNull().default(0),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("services_active_idx").on(table.active),
    index("services_sort_order_idx").on(table.sortOrder),
  ]
);

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

// weekday: 0 = domingo ... 6 = sábado (convenção JS Date#getDay()).
export const businessHours = sqliteTable(
  "business_hours",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    weekday: integer("weekday").notNull().unique(),
    isClosed: integer("is_closed", { mode: "boolean" }).notNull().default(false),
    openMinute: integer("open_minute"),
    closeMinute: integer("close_minute"),
  }
);

export type BusinessHour = typeof businessHours.$inferSelect;
export type NewBusinessHour = typeof businessHours.$inferInsert;

export const blockedPeriods = sqliteTable(
  "blocked_periods",
  {
    id: text("id").primaryKey(),
    startAt: integer("start_at", { mode: "timestamp" }).notNull(),
    endAt: integer("end_at", { mode: "timestamp" }).notNull(),
    reason: text("reason"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("blocked_periods_start_at_idx").on(table.startAt)]
);

export type BlockedPeriod = typeof blockedPeriods.$inferSelect;
export type NewBlockedPeriod = typeof blockedPeriods.$inferInsert;
