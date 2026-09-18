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
  expense: "#86EFAC",
  light: "#4ADE80",
  grid: "#D1FAE5",
};

const GREEN_SCALE = ["#14532D", "#166534", "#15803D", "#16A34A", "#22C55E", "#4ADE80", "#86EFAC"];

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
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} width={70} />
        <Tooltip formatter={(value) => formatCentsToBRL(Number(value) * 100)} />
        <Legend />
        <Bar dataKey="Entradas" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
        <Bar dataKey="Saídas" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} />
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
          {chartData.map((row, index) => (
            <Cell key={row.name} fill={GREEN_SCALE[index % GREEN_SCALE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
