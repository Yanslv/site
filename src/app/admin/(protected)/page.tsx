import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  CheckCheck,
  BadgePercent,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Hourglass,
} from "lucide-react";
import { getOverviewMetrics, getMonthlyChartData, getRevenueByServiceChart } from "@/server/dashboard";
import { formatCentsToBRL } from "@/lib/money";
import { zonedTimeToUtc, todayDateKey } from "@/lib/timezone";
import StatCard from "@/components/admin/StatCard";
import { MonthlyFlowChart, RevenueByServiceChart } from "@/components/admin/OverviewCharts";

export const metadata: Metadata = { title: "Visão geral | Painel Bendita Micro" };

function monthKeyFromDateKey(dateKeyValue: string): string {
  return dateKeyValue.slice(0, 7);
}

function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [year, month] = monthKey.split("-").map(Number);
  return { year, month };
}

function shiftMonthKey(monthKey: string, delta: number): string {
  const { year, month } = parseMonthKey(monthKey);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}`;
}

function monthLabel(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
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

  const [metrics, monthlyChart, revenueByService] = await Promise.all([
    getOverviewMetrics(periodStart, periodEnd),
    getMonthlyChartData(6),
    getRevenueByServiceChart(periodStart, periodEnd),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Visão geral</h1>
          <p className="text-sm text-ink/60">Período: {monthLabel(monthKey)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin?mes=${shiftMonthKey(monthKey, -1)}`}
            className="inline-flex items-center gap-1 rounded-full border border-surface px-3 py-1.5 text-sm text-ink/70 hover:bg-surface"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Link>
          <Link
            href={`/admin?mes=${shiftMonthKey(monthKey, 1)}`}
            className="inline-flex items-center gap-1 rounded-full border border-surface px-3 py-1.5 text-sm text-ink/70 hover:bg-surface"
          >
            Próximo <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={CalendarDays}
          iconClassName="bg-[#CCFBF1] text-[#0F766E]"
          label="Agendamentos hoje"
          value={String(metrics.todayAppointments)}
        />
        <StatCard
          icon={Clock}
          iconClassName="bg-[#FEF3C7] text-[#B45309]"
          label="Pendentes"
          value={String(metrics.pendingAppointments)}
        />
        <StatCard
          icon={CheckCheck}
          iconClassName="bg-[#DCFCE7] text-[#15803D]"
          label="Concluídos no período"
          value={String(metrics.completedThisPeriod)}
        />
        <StatCard
          icon={BadgePercent}
          iconClassName="bg-[#DBEAFE] text-[#1D4ED8]"
          label="Ticket médio"
          value={formatCentsToBRL(metrics.averageTicketCents)}
        />
        <StatCard
          icon={TrendingUp}
          iconClassName="bg-[#D1FAE5] text-[#14532D]"
          label="Receita recebida"
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
          hint={metrics.netProfitCents < 0 ? "Negativo no período" : undefined}
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
          <h2 className="mb-2 text-sm font-semibold text-ink">Entradas e saídas (6 meses)</h2>
          <MonthlyFlowChart data={monthlyChart} />
        </div>
        <div className="rounded-2xl border border-surface bg-background p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-ink">Receita por procedimento (período)</h2>
          {revenueByService.length > 0 ? (
            <RevenueByServiceChart data={revenueByService} />
          ) : (
            <p className="py-10 text-center text-sm text-ink/50">
              Nenhuma receita registrada neste período.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
