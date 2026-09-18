import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  BadgePercent,
  CheckCheck,
  Hourglass,
} from "lucide-react";
import { listTransactions, listServicesForFinance } from "@/server/finance";
import { getOverviewMetrics, getMonthlyChartData, getRevenueByServiceChart } from "@/server/dashboard";
import { groupByCategory } from "@/lib/finance";
import { formatCentsToBRL } from "@/lib/money";
import { zonedTimeToUtc, formatZonedDate, todayDateKey } from "@/lib/timezone";
import {
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUS_LABELS,
  categoryLabel,
} from "@/lib/labels";
import { TRANSACTION_STATUSES, PAYMENT_METHODS } from "@/db/schema";
import StatCard from "@/components/admin/StatCard";
import DemoBadge from "@/components/admin/DemoBadge";
import ErrorBanner from "@/components/admin/ErrorBanner";
import { MonthlyFlowChart } from "@/components/admin/OverviewCharts";
import CategoryBarChart from "@/components/admin/CategoryBarChart";
import { createTransactionAction } from "@/app/actions/admin-finance";

export const metadata: Metadata = { title: "Financeiro | Painel Bendita Micro" };

function monthKeyFromDateKey(dateKeyValue: string): string {
  return dateKeyValue.slice(0, 7);
}
function parseMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return { year, month };
}
function shiftMonthKey(monthKey: string, delta: number): string {
  const { year, month } = parseMonthKey(monthKey);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}`;
}

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; erro?: string }>;
}) {
  const params = await searchParams;
  const monthKey = params.mes ?? monthKeyFromDateKey(todayDateKey());
  const { year, month } = parseMonthKey(monthKey);

  const periodStart = zonedTimeToUtc({ year, month, day: 1, hour: 0, minute: 0 });
  const nextMonthStart = zonedTimeToUtc({
    year: month === 12 ? year + 1 : year,
    month: month === 12 ? 1 : month + 1,
    day: 1,
    hour: 0,
    minute: 0,
  });
  const periodEnd = new Date(nextMonthStart.getTime() - 1000);

  const [metrics, monthlyChart, revenueByService, periodTransactions, services] = await Promise.all([
    getOverviewMetrics(periodStart, periodEnd),
    getMonthlyChartData(6),
    getRevenueByServiceChart(periodStart, periodEnd),
    listTransactions({ dateFrom: periodStart, dateTo: periodEnd }),
    listServicesForFinance(),
  ]);

  const paidIncomeCount = periodTransactions.filter(
    (t) => t.type === "income" && t.status === "paid"
  ).length;

  const expensesByCategory = groupByCategory(periodTransactions, "expense");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Financeiro</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/financeiro?mes=${shiftMonthKey(monthKey, -1)}`}
            className="inline-flex items-center gap-1 rounded-full border border-surface px-3 py-1.5 text-sm text-ink/70 hover:bg-surface"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Link>
          <span className="text-sm font-medium text-ink">{monthKey}</span>
          <Link
            href={`/admin/financeiro?mes=${shiftMonthKey(monthKey, 1)}`}
            className="inline-flex items-center gap-1 rounded-full border border-surface px-3 py-1.5 text-sm text-ink/70 hover:bg-surface"
          >
            Próximo <ChevronRight className="h-4 w-4" />
          </Link>
          <a
            href={`/admin/financeiro/export?de=${periodStart.toISOString().slice(0, 10)}&ate=${periodEnd
              .toISOString()
              .slice(0, 10)}`}
            className="inline-flex items-center gap-2 rounded-full bg-wine px-4 py-2 text-sm font-medium text-background hover:bg-ink"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </a>
        </div>
      </div>

      <ErrorBanner message={params.erro} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={TrendingUp}
          iconClassName="bg-[#D1FAE5] text-[#14532D]"
          label="Receita bruta"
          value={formatCentsToBRL(metrics.grossRevenueCents)}
        />
        <StatCard
          icon={TrendingDown}
          iconClassName="bg-[#FFEDD5] text-[#C2410C]"
          label="Despesas"
          value={formatCentsToBRL(metrics.expensesCents)}
        />
        <StatCard
          icon={PiggyBank}
          iconClassName="bg-[#ECFCCB] text-[#3F6212]"
          label="Lucro líquido"
          value={formatCentsToBRL(metrics.netProfitCents)}
        />
        <StatCard
          icon={BadgePercent}
          iconClassName="bg-[#DBEAFE] text-[#1D4ED8]"
          label="Ticket médio"
          value={formatCentsToBRL(metrics.averageTicketCents)}
        />
        <StatCard
          icon={CheckCheck}
          iconClassName="bg-[#DCFCE7] text-[#15803D]"
          label="Serviços pagos"
          value={String(paidIncomeCount)}
        />
        <StatCard
          icon={Hourglass}
          iconClassName="bg-[#F3E8FF] text-[#7C3AED]"
          label="Saldo a receber"
          value={formatCentsToBRL(metrics.outstandingBalanceCents)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-surface bg-background p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-ink">Comparação mensal (6 meses)</h2>
          <MonthlyFlowChart data={monthlyChart} />
        </div>
        <div className="rounded-2xl border border-surface bg-background p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-ink">Despesas por categoria (mês)</h2>
          {expensesByCategory.length > 0 ? (
            <CategoryBarChart
              data={expensesByCategory.map((c) => ({ label: categoryLabel(c.category), totalCents: c.totalCents }))}
            />
          ) : (
            <p className="py-10 text-center text-sm text-ink/50">Nenhuma despesa paga neste período.</p>
          )}
        </div>
      </div>

      {revenueByService.length > 0 && (
        <div className="rounded-2xl border border-surface bg-background p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-ink">Receita por procedimento (mês)</h2>
          <CategoryBarChart
            data={revenueByService.map((s) => ({ label: s.name, totalCents: s.totalCents }))}
          />
        </div>
      )}

      <section className="rounded-2xl border border-surface bg-background p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Novo lançamento</h2>
        <form action={createTransactionAction} className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="type" className="text-xs font-medium text-ink/60">
              Tipo
            </label>
            <select id="type" name="type" required className="rounded-lg border border-surface px-2 py-1.5 text-sm">
              <option value="income">Entrada</option>
              <option value="expense">Saída</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="category" className="text-xs font-medium text-ink/60">
              Categoria
            </label>
            <select id="category" name="category" required className="rounded-lg border border-surface px-2 py-1.5 text-sm">
              <optgroup label="Entrada">
                {Object.entries(INCOME_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Saída">
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="amountCents" className="text-xs font-medium text-ink/60">
              Valor (centavos)
            </label>
            <input
              id="amountCents"
              name="amountCents"
              type="number"
              min={1}
              required
              className="rounded-lg border border-surface px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="financialDate" className="text-xs font-medium text-ink/60">
              Data
            </label>
            <input
              id="financialDate"
              name="financialDate"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-lg border border-surface px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="paymentMethod" className="text-xs font-medium text-ink/60">
              Forma de pagamento
            </label>
            <select id="paymentMethod" name="paymentMethod" required className="rounded-lg border border-surface px-2 py-1.5 text-sm">
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-xs font-medium text-ink/60">
              Status
            </label>
            <select id="status" name="status" required defaultValue="paid" className="rounded-lg border border-surface px-2 py-1.5 text-sm">
              {TRANSACTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TRANSACTION_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="serviceId" className="text-xs font-medium text-ink/60">
              Procedimento (opcional)
            </label>
            <select id="serviceId" name="serviceId" className="rounded-lg border border-surface px-2 py-1.5 text-sm">
              <option value="">—</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor="description" className="text-xs font-medium text-ink/60">
              Descrição
            </label>
            <input id="description" name="description" className="rounded-lg border border-surface px-2 py-1.5 text-sm" />
          </div>
          <div className="flex items-end sm:col-span-3">
            <button
              type="submit"
              className="rounded-full bg-wine px-6 py-2.5 text-sm font-medium text-background hover:bg-ink"
            >
              Adicionar lançamento
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
          Lançamentos do período
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-surface bg-background shadow-sm">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-surface text-left text-xs uppercase tracking-wide text-ink/50">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Forma</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {periodTransactions.map((t) => (
                <tr key={t.id} className="border-b border-surface last:border-0">
                  <td className="px-4 py-3 text-ink/70">{formatZonedDate(t.financialDate)}</td>
                  <td className="px-4 py-3">
                    <span className={t.type === "income" ? "text-green-700" : "text-red-600"}>
                      {t.type === "income" ? "Entrada" : "Saída"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{categoryLabel(t.category)}</td>
                  <td className="px-4 py-3 text-ink/70">
                    {t.description || "—"} {t.isDemo && <DemoBadge />}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{PAYMENT_METHOD_LABELS[t.paymentMethod]}</td>
                  <td className="px-4 py-3 text-ink/70">{TRANSACTION_STATUS_LABELS[t.status]}</td>
                  <td className="px-4 py-3 text-right font-medium text-ink">
                    {formatCentsToBRL(t.amountCents)}
                  </td>
                </tr>
              ))}
              {periodTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-ink/50">
                    Nenhum lançamento neste período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
