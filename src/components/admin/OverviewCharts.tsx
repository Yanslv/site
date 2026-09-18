"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCentsToBRL } from "@/lib/money";

export const CHART_COLORS = {
  income: "#14532D",
  expense: "#DC2626",
  grid: "#EEE7E4",
};

const PASTEL_BARS = [
  "#F7C6D0",
  "#C9E4CA",
  "#B8D4E8",
  "#F6E2B3",
  "#D7C6E6",
  "#F5D0B5",
  "#B8E0D6",
  "#F3C6DE",
  "#D4E5B8",
  "#C5D5F0",
];

export function pastelForKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 33 + key.charCodeAt(i)) >>> 0;
  }
  return PASTEL_BARS[hash % PASTEL_BARS.length];
}

export type MonthlyChartPoint = { monthKey: string; incomeCents: number; expenseCents: number };
export type ServiceRevenuePoint = { name: string; totalCents: number };

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

export function MonthlyFlowChart({ data }: { data: MonthlyChartPoint[] }) {
  const chartData = data.map((d) => ({
    month: formatMonthLabel(d.monthKey),
    Entradas: d.incomeCents / 100,
    Saídas: d.expenseCents / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 48)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
        <YAxis type="category" dataKey="month" tick={{ fontSize: 12 }} width={64} />
        <Tooltip formatter={(value) => formatCentsToBRL(Number(value) * 100)} />
        <Legend />
        <Bar dataKey="Entradas" fill={CHART_COLORS.income} radius={[0, 4, 4, 0]} />
        <Bar dataKey="Saídas" fill={CHART_COLORS.expense} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueByServiceChart({ data }: { data: ServiceRevenuePoint[] }) {
  const chartData = data.map((d) => ({ name: d.name, Receita: d.totalCents / 100 }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
        <Tooltip formatter={(value) => formatCentsToBRL(Number(value) * 100)} />
        <Bar dataKey="Receita" radius={[0, 4, 4, 0]}>
          {chartData.map((row) => (
            <Cell key={row.name} fill={pastelForKey(row.name)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
