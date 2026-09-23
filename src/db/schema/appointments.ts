import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { customers } from "./customers";
import { services } from "./services";
import { users } from "./auth";

export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "canceled",
  "no_show",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

// Status que ocupam o horário na agenda (bloqueiam novos agendamentos).
export const OCCUPYING_STATUSES: AppointmentStatus[] = ["pending", "confirmed", "completed"];

export const PAYMENT_STATUSES = ["unpaid", "partially_paid", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const APPOINTMENT_ORIGINS = [
  "site",
  "whatsapp",
  "instagram",
  "telefone",
  "presencial",
] as const;
export type AppointmentOrigin = (typeof APPOINTMENT_ORIGINS)[number];

export const appointments = sqliteTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    protocol: text("protocol").notNull().unique(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    serviceId: text("service_id").references(() => services.id, { onDelete: "set null" }),
    serviceNameSnapshot: text("service_name_snapshot").notNull(),
    serviceDurationSnapshot: integer("service_duration_snapshot").notNull(),
    servicePriceSnapshot: integer("service_price_snapshot").notNull(),
    startAtUtc: integer("start_at_utc", { mode: "timestamp" }).notNull(),
    endAtUtc: integer("end_at_utc", { mode: "timestamp" }).notNull(),
    timezone: text("timezone").notNull().default("America/Cuiaba"),
    status: text("status", { enum: APPOINTMENT_STATUSES }).notNull().default("pending"),
    paymentStatus: text("payment_status", { enum: PAYMENT_STATUSES })
      .notNull()
      .default("unpaid"),
    origin: text("origin", { enum: APPOINTMENT_ORIGINS }).notNull().default("site"),
    publicNote: text("public_note"),
    internalNote: text("internal_note"),
    kind: text("kind", { enum: ["procedure", "return"] }).notNull().default("procedure"),
    parentAppointmentId: text("parent_appointment_id"),
    returnAdjusted: integer("return_adjusted", { mode: "boolean" }).notNull().default(false),
    returnPlannedAt: integer("return_planned_at", { mode: "timestamp" }),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("appointments_start_at_idx").on(table.startAtUtc),
    index("appointments_status_idx").on(table.status),
    index("appointments_service_idx").on(table.serviceId),
    index("appointments_customer_idx").on(table.customerId),
    index("appointments_parent_idx").on(table.parentAppointmentId),
  ]
);

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

export const appointmentEvents = sqliteTable(
  "appointment_events",
  {
    id: text("id").primaryKey(),
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    fromStatus: text("from_status", { enum: APPOINTMENT_STATUSES }),
    toStatus: text("to_status", { enum: APPOINTMENT_STATUSES }).notNull(),
    note: text("note"),
    createdByUserId: text("created_by_user_id").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("appointment_events_appointment_idx").on(table.appointmentId)]
);

export type AppointmentEvent = typeof appointmentEvents.$inferSelect;
export type NewAppointmentEvent = typeof appointmentEvents.$inferInsert;
