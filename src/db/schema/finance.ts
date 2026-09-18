import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { appointments } from "./appointments";
import { services } from "./services";
import { users } from "./auth";

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const INCOME_CATEGORIES = ["servico", "sinal", "retoque", "outro"] as const;
export const EXPENSE_CATEGORIES = [
  "materiais",
  "aluguel",
  "marketing",
  "taxas",
  "transporte",
  "salarios_comissoes",
  "manutencao",
  "impostos",
  "outro",
] as const;
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_METHODS = ["pix", "dinheiro", "cartao", "transferencia", "outro"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TRANSACTION_STATUSES = ["paid", "pending"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    type: text("type", { enum: TRANSACTION_TYPES }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    financialDate: integer("financial_date", { mode: "timestamp" }).notNull(),
    category: text("category").notNull(),
    description: text("description"),
    note: text("note"),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }).notNull(),
    status: text("status", { enum: TRANSACTION_STATUSES }).notNull().default("paid"),
    appointmentId: text("appointment_id").references(() => appointments.id, {
      onDelete: "set null",
    }),
    serviceId: text("service_id").references(() => services.id, { onDelete: "set null" }),
    createdByUserId: text("created_by_user_id").references(() => users.id),
    // Garante que o registro de pagamento de um agendamento (a partir da UI)
    // não duplique receita em caso de duplo clique ou retry de rede.
    idempotencyKey: text("idempotency_key").unique(),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("transactions_financial_date_idx").on(table.financialDate),
    index("transactions_type_idx").on(table.type),
    index("transactions_status_idx").on(table.status),
    index("transactions_appointment_idx").on(table.appointmentId),
  ]
);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
