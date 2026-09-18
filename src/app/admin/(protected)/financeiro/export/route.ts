import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { listTransactions } from "@/server/finance";
import { toCsv } from "@/lib/csv";
import { formatZonedDate } from "@/lib/timezone";
import { categoryLabel, PAYMENT_METHOD_LABELS, TRANSACTION_STATUS_LABELS } from "@/lib/labels";
import { parseDateKey, zonedTimeToUtc, addMinutes } from "@/lib/timezone";

export async function GET(request: NextRequest) {
  // Sem sessão válida, requireUser() redireciona para /admin/login — mesma
  // proteção server-side usada nas páginas do painel.
  await requireUser();

  const { searchParams } = new URL(request.url);
  const de = searchParams.get("de");
  const ate = searchParams.get("ate");

  const dateFrom = de ? zonedTimeToUtc({ ...parseDateKey(de), hour: 0, minute: 0 }) : undefined;
  const dateTo = ate
    ? addMinutes(zonedTimeToUtc({ ...parseDateKey(ate), hour: 0, minute: 0 }), 24 * 60 - 1)
    : undefined;

  const transactions = await listTransactions({ dateFrom, dateTo });

  const csv = toCsv(transactions, [
    { header: "Data", value: (t) => formatZonedDate(t.financialDate) },
    { header: "Tipo", value: (t) => (t.type === "income" ? "Entrada" : "Saída") },
    { header: "Categoria", value: (t) => categoryLabel(t.category) },
    { header: "Descrição", value: (t) => t.description ?? "" },
    { header: "Procedimento", value: (t) => t.serviceName ?? "" },
    { header: "Forma de pagamento", value: (t) => PAYMENT_METHOD_LABELS[t.paymentMethod] ?? t.paymentMethod },
    { header: "Status", value: (t) => TRANSACTION_STATUS_LABELS[t.status] ?? t.status },
    { header: "Valor (R$)", value: (t) => (t.amountCents / 100).toFixed(2).replace(".", ",") },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bendita-micro-financeiro-${de ?? "inicio"}-a-${ate ?? "fim"}.csv"`,
    },
  });
}
