import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  transactions,
  appointments,
  services,
  type Transaction,
  type TransactionType,
  type PaymentMethod,
} from "@/db/schema";
import { computePaymentStatus } from "@/lib/finance";

export type TransactionFilters = {
  dateFrom?: Date;
  dateTo?: Date;
  type?: TransactionType;
  status?: "paid" | "pending";
};

export async function listTransactions(filters: TransactionFilters = {}): Promise<
  (Transaction & { serviceName: string | null })[]
> {
  const conditions = [];
  if (filters.dateFrom) conditions.push(gte(transactions.financialDate, filters.dateFrom));
  if (filters.dateTo) conditions.push(lte(transactions.financialDate, filters.dateTo));
  if (filters.type) conditions.push(eq(transactions.type, filters.type));
  if (filters.status) conditions.push(eq(transactions.status, filters.status));

  const rows = await db
    .select({ transaction: transactions, serviceName: services.name })
    .from(transactions)
    .leftJoin(services, eq(transactions.serviceId, services.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactions.financialDate));

  return rows.map((r) => ({ ...r.transaction, serviceName: r.serviceName }));
}

export async function createTransaction(input: {
  type: TransactionType;
  amountCents: number;
  financialDate: Date;
  category: string;
  description?: string | null;
  note?: string | null;
  paymentMethod: PaymentMethod;
  status: "paid" | "pending";
  appointmentId?: string | null;
  serviceId?: string | null;
  userId: string;
}): Promise<Transaction> {
  const now = new Date();
  const [row] = await db
    .insert(transactions)
    .values({
      id: randomUUID(),
      type: input.type,
      amountCents: input.amountCents,
      financialDate: input.financialDate,
      category: input.category,
      description: input.description || null,
      note: input.note || null,
      paymentMethod: input.paymentMethod,
      status: input.status,
      appointmentId: input.appointmentId || null,
      serviceId: input.serviceId || null,
      createdByUserId: input.userId,
      idempotencyKey: `manual:${randomUUID()}`,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return row;
}

async function getPaidCentsForAppointment(appointmentId: string): Promise<number> {
  const [{ paidCents }] = await db
    .select({ paidCents: sql<number>`coalesce(sum(${transactions.amountCents}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.appointmentId, appointmentId),
        eq(transactions.type, "income"),
        eq(transactions.status, "paid")
      )
    );
  return paidCents;
}

/**
 * Registra um pagamento vinculado a um agendamento de forma idempotente: se
 * a mesma `idempotencyKey` já foi usada (duplo clique, retry de rede), a
 * transação existente é devolvida em vez de duplicar a receita.
 */
export async function registerAppointmentPayment(input: {
  appointmentId: string;
  amountCents: number;
  paymentMethod: PaymentMethod;
  financialDate: Date;
  note?: string | null;
  idempotencyKey: string;
  userId: string;
}): Promise<{ transaction: Transaction; paidCents: number; paymentStatus: string }> {
  const [appointment] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, input.appointmentId))
    .limit(1);
  if (!appointment) throw new Error("Agendamento não encontrado.");

  return db.transaction(async (tx) => {
    const now = new Date();
    await tx
      .insert(transactions)
      .values({
        id: randomUUID(),
        type: "income",
        amountCents: input.amountCents,
        financialDate: input.financialDate,
        category: "servico",
        description: `Pagamento — ${appointment.serviceNameSnapshot}`,
        note: input.note || null,
        paymentMethod: input.paymentMethod,
        status: "paid",
        appointmentId: input.appointmentId,
        serviceId: appointment.serviceId,
        createdByUserId: input.userId,
        idempotencyKey: input.idempotencyKey,
        isDemo: false,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: transactions.idempotencyKey });

    const [transaction] = await tx
      .select()
      .from(transactions)
      .where(eq(transactions.idempotencyKey, input.idempotencyKey))
      .limit(1);

    const paidRows = await tx
      .select({ paidCents: sql<number>`coalesce(sum(${transactions.amountCents}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.appointmentId, input.appointmentId),
          eq(transactions.type, "income"),
          eq(transactions.status, "paid")
        )
      );
    const paidCents = paidRows[0].paidCents;
    const paymentStatus = computePaymentStatus(appointment.servicePriceSnapshot, paidCents);

    await tx
      .update(appointments)
      .set({ paymentStatus, updatedAt: now })
      .where(eq(appointments.id, input.appointmentId));

    return { transaction, paidCents, paymentStatus };
  });
}

export { getPaidCentsForAppointment };

export async function listServicesForFinance() {
  return db.select({ id: services.id, name: services.name }).from(services).orderBy(asc(services.sortOrder));
}
