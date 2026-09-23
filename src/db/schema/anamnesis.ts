import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { appointments } from "./appointments";
import { customers } from "./customers";

export const ANAMNESIS_STATUSES = ["draft", "completed"] as const;
export type AnamnesisStatus = (typeof ANAMNESIS_STATUSES)[number];

export const anamneses = sqliteTable(
  "anamneses",
  {
    id: text("id").primaryKey(),
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    status: text("status", { enum: ANAMNESIS_STATUSES }).notNull().default("draft"),
    payload: text("payload").notNull(),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("anamneses_appointment_unique").on(table.appointmentId),
    index("anamneses_customer_idx").on(table.customerId),
  ]
);

export type Anamnesis = typeof anamneses.$inferSelect;
export type NewAnamnesis = typeof anamneses.$inferInsert;
