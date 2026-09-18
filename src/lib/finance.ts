import type { PaymentStatus } from "@/db/schema";

export type FinanceTransactionLike = {
  type: "income" | "expense";
  amountCents: number;
  status: "paid" | "pending";
};

/** receita bruta = soma das entradas pagas */
export function calculateGrossRevenueCents(transactions: FinanceTransactionLike[]): number {
  return transactions
    .filter((t) => t.type === "income" && t.status === "paid")
    .reduce((sum, t) => sum + t.amountCents, 0);
}

/** saídas = soma das despesas pagas */
export function calculateExpensesCents(transactions: FinanceTransactionLike[]): number {
  return transactions
    .filter((t) => t.type === "expense" && t.status === "paid")
    .reduce((sum, t) => sum + t.amountCents, 0);
}

/** lucro líquido = receita bruta - saídas */
export function calculateNetProfitCents(transactions: FinanceTransactionLike[]): number {
  return calculateGrossRevenueCents(transactions) - calculateExpensesCents(transactions);
}

/** ticket médio = receita bruta / quantidade de serviços (entradas) pagos */
export function calculateAverageTicketCents(transactions: FinanceTransactionLike[]): number {
  const paidIncome = transactions.filter((t) => t.type === "income" && t.status === "paid");
  if (paidIncome.length === 0) return 0;
  const total = paidIncome.reduce((sum, t) => sum + t.amountCents, 0);
  return Math.round(total / paidIncome.length);
}

export type AppointmentBalanceLike = {
  status: "pending" | "confirmed" | "completed" | "canceled" | "no_show";
  servicePriceSnapshot: number;
  paidCents: number;
};

/**
 * saldo a receber = soma, por agendamento confirmado ou concluído, do valor
 * ainda não pago (preço do serviço - total já recebido nesse agendamento).
 * Nunca soma valor negativo (agendamento pago a mais não gera crédito aqui).
 */
export function calculateOutstandingBalanceCents(
  appointments: AppointmentBalanceLike[]
): number {
  return appointments
    .filter((a) => a.status === "confirmed" || a.status === "completed")
    .reduce((sum, a) => sum + Math.max(0, a.servicePriceSnapshot - a.paidCents), 0);
}

/** Deriva o status de pagamento de um agendamento a partir do total já pago. */
export function computePaymentStatus(
  servicePriceCents: number,
  paidCents: number
): PaymentStatus {
  if (paidCents <= 0) return "unpaid";
  if (paidCents >= servicePriceCents) return "paid";
  return "partially_paid";
}

export type CategoryTotal = { category: string; totalCents: number };

export function groupByCategory(
  transactions: (FinanceTransactionLike & { category: string })[],
  type: "income" | "expense"
): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== type || t.status !== "paid") continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amountCents);
  }
  return [...totals.entries()]
    .map(([category, totalCents]) => ({ category, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export type ServiceRevenue = { serviceId: string; totalCents: number };

export function groupRevenueByService(
  transactions: (FinanceTransactionLike & { serviceId: string | null })[]
): ServiceRevenue[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "income" || t.status !== "paid" || !t.serviceId) continue;
    totals.set(t.serviceId, (totals.get(t.serviceId) ?? 0) + t.amountCents);
  }
  return [...totals.entries()]
    .map(([serviceId, totalCents]) => ({ serviceId, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export type MonthlyTotals = { monthKey: string; incomeCents: number; expenseCents: number; profitCents: number };

export function groupByMonth(
  transactions: (FinanceTransactionLike & { financialDate: Date })[]
): MonthlyTotals[] {
  const totals = new Map<string, { incomeCents: number; expenseCents: number }>();
  for (const t of transactions) {
    if (t.status !== "paid") continue;
    const monthKey = `${t.financialDate.getUTCFullYear()}-${(t.financialDate.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    const current = totals.get(monthKey) ?? { incomeCents: 0, expenseCents: 0 };
    if (t.type === "income") current.incomeCents += t.amountCents;
    else current.expenseCents += t.amountCents;
    totals.set(monthKey, current);
  }
  return [...totals.entries()]
    .map(([monthKey, values]) => ({
      monthKey,
      ...values,
      profitCents: values.incomeCents - values.expenseCents,
    }))
    .sort((a, b) => (a.monthKey < b.monthKey ? -1 : 1));
}
