"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatCentsToBRL } from "@/lib/money";

export type CategoryPoint = { label: string; totalCents: number };

export default function CategoryBarChart({ data, color }: { data: CategoryPoint[]; color: string }) {
  const chartData = data.map((d) => ({ name: d.label, Total: d.totalCents / 100 }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#D1FAE5" />
        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
        <Tooltip formatter={(value) => formatCentsToBRL(Number(value) * 100)} />
        <Bar dataKey="Total" fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
