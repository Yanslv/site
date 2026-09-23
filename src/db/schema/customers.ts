import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    whatsapp: text("whatsapp").notNull(),
    email: text("email"),
    birthDate: text("birth_date"),
    rg: text("rg"),
    cpf: text("cpf"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    notes: text("notes"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("customers_whatsapp_idx").on(table.whatsapp)]
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
