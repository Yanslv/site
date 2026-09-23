import "server-only";
import { and, asc, eq, gte, lt, lte, sql, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { anamneses, appointments, customers, transactions, services, type AppointmentStatus } from "@/db/schema";
import {
  calculateGrossRevenueCents,
  calculateExpensesCents,
  calculateNetProfitCents,
  calculateAverageTicketCents,
  calculateOutstandingBalanceCents,
  groupByMonth,
  groupRevenueByService,
  type FinanceTransactionLike,
} from "@/lib/finance";
import { parseDateKey, zonedTimeToUtc, addMinutes, todayDateKey, BUSINESS_TIMEZONE } from "@/lib/timezone";
import { getPaidCentsForAppointment } from "./finance";

function dateKeyToUtcRange(dateKeyValue: string) {
  const { year, month, day } = parseDateKey(dateKeyValue);
  const start = zonedTimeToUtc({ year, month, day, hour: 0, minute: 0 }, BUSINESS_TIMEZONE);
  const end = addMinutes(start, 24 * 60);
  return { start, end };
}

export async function getOverviewMetrics(periodStart: Date, periodEnd: Date) {
  const todayKey = todayDateKey();
  const { start: todayStart, end: todayEnd } = dateKeyToUtcRange(todayKey);

  const [todayCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(and(eq(appointments.isDemo, false), gte(appointments.startAtUtc, todayStart), lte(appointments.startAtUtc, todayEnd)));

  const [pendingCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(and(eq(appointments.isDemo, false), eq(appointments.status, "pending")));

  const [completedThisMonthRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(
      and(
        eq(appointments.isDemo, false),
        eq(appointments.status, "completed"),
        gte(appointments.startAtUtc, periodStart),
        lte(appointments.startAtUtc, periodEnd)
      )
    );

  const periodTransactions = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.isDemo, false), gte(transactions.financialDate, periodStart), lte(transactions.financialDate, periodEnd)));

  const financeLike: FinanceTransactionLike[] = periodTransactions.map((t) => ({
    type: t.type,
    amountCents: t.amountCents,
    status: t.status,
  }));

  const outstandingAppointments = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.isDemo, false), inArray(appointments.status, ["confirmed", "completed"])));

  const outstandingWithPaid = await Promise.all(
    outstandingAppointments.map(async (a) => ({
      status: a.status,
      servicePriceSnapshot: a.servicePriceSnapshot,
      paidCents: await getPaidCentsForAppointment(a.id),
    }))
  );

  const grossRevenueCents = calculateGrossRevenueCents(financeLike);
  const expensesCents = calculateExpensesCents(financeLike);

  return {
    todayAppointments: todayCountRow.count,
    pendingAppointments: pendingCountRow.count,
    completedThisPeriod: completedThisMonthRow.count,
    grossRevenueCents,
    expensesCents,
    netProfitCents: calculateNetProfitCents(financeLike),
    averageTicketCents: calculateAverageTicketCents(financeLike),
    outstandingBalanceCents: calculateOutstandingBalanceCents(outstandingWithPaid),
  };
}

const ATTENDING_STATUSES: AppointmentStatus[] = ["pending", "confirmed", "completed"];

async function paidCentsByAppointment(appointmentIds: string[]): Promise<Map<string, number>> {
  const paidRows = await db
    .select({
      appointmentId: transactions.appointmentId,
      paidCents: sql<number>`coalesce(sum(${transactions.amountCents}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        inArray(transactions.appointmentId, appointmentIds),
        eq(transactions.type, "income"),
        eq(transactions.status, "paid"),
        eq(transactions.isDemo, false)
      )
    )
    .groupBy(transactions.appointmentId);

  return new Map(
    paidRows.flatMap((row) =>
      row.appointmentId ? [[row.appointmentId, row.paidCents] as const] : []
    )
  );
}

export async function getDayAttendance(dateKeyValue: string) {
  const { start, end } = dateKeyToUtcRange(dateKeyValue);
  const rows = await db
    .select({
      appointmentId: appointments.id,
      customerId: customers.id,
      customerName: customers.name,
      customerWhatsapp: customers.whatsapp,
      serviceName: appointments.serviceNameSnapshot,
      kind: appointments.kind,
      startAtUtc: appointments.startAtUtc,
      endAtUtc: appointments.endAtUtc,
      status: appointments.status,
      paymentStatus: appointments.paymentStatus,
      priceCents: appointments.servicePriceSnapshot,
      anamnesisStatus: anamneses.status,
    })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .leftJoin(anamneses, eq(anamneses.appointmentId, appointments.id))
    .where(
      and(
        eq(appointments.isDemo, false),
        inArray(appointments.status, ATTENDING_STATUSES),
        gte(appointments.startAtUtc, start),
        lt(appointments.startAtUtc, end)
      )
    )
    .orderBy(asc(appointments.startAtUtc));

  if (rows.length === 0) return [];

  const paidByAppointment = await paidCentsByAppointment(rows.map((row) => row.appointmentId));

  return rows.map((row) => {
    const paidCents = paidByAppointment.get(row.appointmentId) ?? 0;
    return {
      ...row,
      paidCents,
      remainingCents: Math.max(0, row.priceCents - paidCents),
    };
  });
}

export async function getMonthlyChartData(monthsBack: number) {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack + 1, 1));

  const rows = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.isDemo, false), gte(transactions.financialDate, from)));
  return groupByMonth(
    rows.map((t) => ({
      type: t.type,
      amountCents: t.amountCents,
      status: t.status,
      financialDate: t.financialDate,
    }))
  );
}

export async function getRevenueByServiceChart(periodStart: Date, periodEnd: Date) {
  const rows = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.isDemo, false), gte(transactions.financialDate, periodStart), lte(transactions.financialDate, periodEnd)));

  const grouped = groupRevenueByService(
    rows.map((t) => ({
      type: t.type,
      amountCents: t.amountCents,
      status: t.status,
      serviceId: t.serviceId,
    }))
  );

  const allServices = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(eq(services.isDemo, false));
  const nameById = new Map(allServices.map((s) => [s.id, s.name]));

  return grouped.map((g) => ({
    serviceId: g.serviceId,
    name: nameById.get(g.serviceId) ?? "Serviço removido",
    totalCents: g.totalCents,
  }));
}
