import { describe, it, expect } from "vitest";
import {
  calculateGrossRevenueCents,
  calculateExpensesCents,
  calculateNetProfitCents,
  calculateAverageTicketCents,
  calculateOutstandingBalanceCents,
  computePaymentStatus,
  groupByCategory,
  groupByMonth,
} from "../finance";

describe("fórmulas financeiras", () => {
  const transactions = [
    { type: "income" as const, amountCents: 65000, status: "paid" as const },
    { type: "income" as const, amountCents: 55000, status: "paid" as const },
    { type: "income" as const, amountCents: 30000, status: "pending" as const }, // não deve contar
    { type: "expense" as const, amountCents: 35000, status: "paid" as const },
    { type: "expense" as const, amountCents: 12000, status: "pending" as const }, // não deve contar
  ];

  it("receita bruta = soma das entradas pagas", () => {
    expect(calculateGrossRevenueCents(transactions)).toBe(120000);
  });

  it("saídas = soma das despesas pagas", () => {
    expect(calculateExpensesCents(transactions)).toBe(35000);
  });

  it("lucro líquido = receita bruta - saídas", () => {
    expect(calculateNetProfitCents(transactions)).toBe(85000);
  });

  it("ticket médio = receita bruta / quantidade de entradas pagas", () => {
    expect(calculateAverageTicketCents(transactions)).toBe(60000);
  });

  it("ticket médio é zero quando não há entradas pagas", () => {
    expect(calculateAverageTicketCents([])).toBe(0);
  });
});

describe("computePaymentStatus", () => {
  it("unpaid quando nada foi pago", () => {
    expect(computePaymentStatus(65000, 0)).toBe("unpaid");
  });
  it("partially_paid quando o valor pago é parcial", () => {
    expect(computePaymentStatus(65000, 20000)).toBe("partially_paid");
  });
  it("paid quando o valor pago cobre o preço", () => {
    expect(computePaymentStatus(65000, 65000)).toBe("paid");
    expect(computePaymentStatus(65000, 70000)).toBe("paid"); // pago a mais também conta como quitado
  });
});

describe("saldo a receber", () => {
  it("soma apenas agendamentos confirmados/concluídos, nunca negativo por item", () => {
    const appointments = [
      { status: "completed" as const, servicePriceSnapshot: 65000, paidCents: 65000 }, // quitado, 0
      { status: "completed" as const, servicePriceSnapshot: 55000, paidCents: 20000 }, // falta 35000
      { status: "confirmed" as const, servicePriceSnapshot: 60000, paidCents: 0 }, // falta 60000
      { status: "pending" as const, servicePriceSnapshot: 9000, paidCents: 0 }, // não conta (ainda não confirmado)
      { status: "canceled" as const, servicePriceSnapshot: 30000, paidCents: 0 }, // não conta
    ];
    expect(calculateOutstandingBalanceCents(appointments)).toBe(35000 + 60000);
  });
});

describe("agrupamentos", () => {
  it("agrupa despesas pagas por categoria, ignorando pendentes e receitas", () => {
    const rows = [
      { type: "expense" as const, amountCents: 35000, status: "paid" as const, category: "materiais" },
      { type: "expense" as const, amountCents: 5000, status: "paid" as const, category: "materiais" },
      { type: "expense" as const, amountCents: 12000, status: "pending" as const, category: "marketing" },
      { type: "income" as const, amountCents: 65000, status: "paid" as const, category: "servico" },
    ];
    expect(groupByCategory(rows, "expense")).toEqual([{ category: "materiais", totalCents: 40000 }]);
  });

  it("agrupa entradas e saídas pagas por mês (UTC)", () => {
    const rows = [
      { type: "income" as const, amountCents: 10000, status: "paid" as const, financialDate: new Date("2026-01-05T12:00:00Z") },
      { type: "expense" as const, amountCents: 3000, status: "paid" as const, financialDate: new Date("2026-01-20T12:00:00Z") },
      { type: "income" as const, amountCents: 20000, status: "paid" as const, financialDate: new Date("2026-02-01T12:00:00Z") },
    ];
    const grouped = groupByMonth(rows);
    expect(grouped).toEqual([
      { monthKey: "2026-01", incomeCents: 10000, expenseCents: 3000, profitCents: 7000 },
      { monthKey: "2026-02", incomeCents: 20000, expenseCents: 0, profitCents: 20000 },
    ]);
  });
});
