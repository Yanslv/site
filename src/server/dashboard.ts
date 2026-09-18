import "server-only";
import { and, eq, gte, lte, sql, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { appointments, transactions, services } from "@/db/schema";
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
    .where(and(gte(appointments.startAtUtc, todayStart), lte(appointments.startAtUtc, todayEnd)));

  const [pendingCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(eq(appointments.status, "pending"));

  const [completedThisMonthRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(
      and(
        eq(appointments.status, "completed"),
        gte(appointments.startAtUtc, periodStart),
        lte(appointments.startAtUtc, periodEnd)
      )
    );

  const periodTransactions = await db
    .select()
    .from(transactions)
    .where(and(gte(transactions.financialDate, periodStart), lte(transactions.financialDate, periodEnd)));

  const financeLike: FinanceTransactionLike[] = periodTransactions.map((t) => ({
    type: t.type,
    amountCents: t.amountCents,
    status: t.status,
  }));

  const outstandingAppointments = await db
    .select()
    .from(appointments)
    .where(inArray(appointments.status, ["confirmed", "completed"]));

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

export async function getMonthlyChartData(monthsBack: number) {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack + 1, 1));

  const rows = await db.select().from(transactions).where(gte(transactions.financialDate, from));
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
    .where(and(gte(transactions.financialDate, periodStart), lte(transactions.financialDate, periodEnd)));

  const grouped = groupRevenueByService(
    rows.map((t) => ({
      type: t.type,
      amountCents: t.amountCents,
      status: t.status,
      serviceId: t.serviceId,
    }))
  );

  const allServices = await db.select({ id: services.id, name: services.name }).from(services);
  const nameById = new Map(allServices.map((s) => [s.id, s.name]));

  return grouped.map((g) => ({
    serviceId: g.serviceId,
    name: nameById.get(g.serviceId) ?? "Serviço removido",
    totalCents: g.totalCents,
  }));
}
