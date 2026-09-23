import { describe, it, expect } from "vitest";
import { publicBookingSchema } from "../booking";
import { serviceSchema } from "../service";
import { transactionSchema, registerPaymentSchema } from "../transaction";
import { canTransitionStatus, manualAppointmentSchema } from "../appointment";

describe("publicBookingSchema", () => {
  const valid = {
    serviceId: "svc-1",
    dateKey: "2026-01-19",
    startAtIso: "2026-01-19T13:00:00.000Z",
    customerName: "Maria da Silva",
    customerWhatsapp: "(65) 90000-0000",
    customerEmail: "",
    publicNote: "",
  };

  it("aceita um payload válido e grava o WhatsApp com DDI", () => {
    const result = publicBookingSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.customerWhatsapp).toBe("5565900000000");
  });

  it("rejeita nome muito curto", () => {
    const result = publicBookingSchema.safeParse({ ...valid, customerName: "A" });
    expect(result.success).toBe(false);
  });

  it("rejeita WhatsApp inválido", () => {
    const result = publicBookingSchema.safeParse({ ...valid, customerWhatsapp: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejeita e-mail malformado quando informado", () => {
    const result = publicBookingSchema.safeParse({ ...valid, customerEmail: "nao-e-email" });
    expect(result.success).toBe(false);
  });

  it("rejeita data em formato inválido", () => {
    const result = publicBookingSchema.safeParse({ ...valid, dateKey: "19/01/2026" });
    expect(result.success).toBe(false);
  });
});

describe("serviceSchema", () => {
  it("aceita um serviço válido e converte tipos de FormData (strings) para número/boolean", () => {
    const result = serviceSchema.safeParse({
      name: "Nano Fios",
      slug: "nano-fios",
      description: "",
      category: "sobrancelhas",
      durationMinutes: "150",
      priceCents: "65000",
      active: "true",
      imagePath: "",
      color: "#7E3948",
      sortOrder: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.durationMinutes).toBe(150);
      expect(result.data.priceCents).toBe(65000);
    }
  });

  it("rejeita slug com espaços ou maiúsculas", () => {
    expect(serviceSchema.safeParse({
      name: "Nano Fios",
      slug: "Nano Fios",
      durationMinutes: "60",
      priceCents: "1000",
      active: "true",
      color: "#7E3948",
      sortOrder: "1",
    }).success).toBe(false);
  });

  it("exige o prazo quando o procedimento tem retorno", () => {
    const result = serviceSchema.safeParse({
      name: "Nano Fios",
      slug: "nano-fios",
      durationMinutes: "60",
      priceCents: "1000",
      active: true,
      color: "#7E3948",
      sortOrder: "1",
      hasReturn: true,
      returnAmount: "",
      returnUnit: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita preço negativo", () => {
    expect(serviceSchema.safeParse({
      name: "Nano Fios",
      slug: "nano-fios",
      durationMinutes: "60",
      priceCents: "-100",
      active: "true",
      color: "#7E3948",
      sortOrder: "1",
    }).success).toBe(false);
  });
});

describe("transactionSchema", () => {
  it("aceita categoria de entrada válida para tipo income", () => {
    const result = transactionSchema.safeParse({
      type: "income",
      amountCents: "5000",
      financialDate: "2026-01-10",
      category: "servico",
      paymentMethod: "pix",
      status: "paid",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita categoria de despesa usada em um lançamento de entrada", () => {
    const result = transactionSchema.safeParse({
      type: "income",
      amountCents: "5000",
      financialDate: "2026-01-10",
      category: "materiais", // categoria de saída
      paymentMethod: "pix",
      status: "paid",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita valor zero ou negativo", () => {
    const result = transactionSchema.safeParse({
      type: "expense",
      amountCents: "0",
      financialDate: "2026-01-10",
      category: "materiais",
      paymentMethod: "pix",
      status: "paid",
    });
    expect(result.success).toBe(false);
  });
});

describe("manualAppointmentSchema", () => {
  const valid = {
    serviceId: "svc-1",
    dateKey: "2026-09-24",
    time: "10:00",
    customerName: "Maria da Silva",
    customerWhatsapp: "(65) 90000-0000",
    customerEmail: "",
    origin: "presencial",
    publicNote: "",
    internalNote: "",
    status: "confirmed",
  };

  it("aceita payload válido do painel", () => {
    expect(manualAppointmentSchema.safeParse(valid).success).toBe(true);
  });

  it("aceita campos ausentes do FormData como vazio (null)", () => {
    const result = manualAppointmentSchema.safeParse({
      ...valid,
      customerEmail: null,
      publicNote: null,
      internalNote: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.publicNote).toBe("");
      expect(result.data.internalNote).toBe("");
    }
  });

  it("aceita horário do input type=time com segundos", () => {
    const result = manualAppointmentSchema.safeParse({ ...valid, time: "10:00:00" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.time).toBe("10:00");
  });
});

describe("registerPaymentSchema", () => {
  it("aceita Pix, dinheiro e cartão sem observação", () => {
    for (const paymentMethod of ["pix", "dinheiro", "cartao"]) {
      const result = registerPaymentSchema.safeParse({
        appointmentId: "apt-1",
        amountCents: "15000",
        paymentMethod,
        financialDate: "2026-09-23",
        note: null,
        idempotencyKey: "key-1",
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("transições de status de agendamento", () => {
  it("permite pending -> confirmed", () => {
    expect(canTransitionStatus("pending", "confirmed")).toBe(true);
  });
  it("permite confirmed -> completed", () => {
    expect(canTransitionStatus("confirmed", "completed")).toBe(true);
  });
  it("não permite transição para o mesmo status", () => {
    expect(canTransitionStatus("pending", "pending")).toBe(false);
  });
  it("não permite sair de completed (estado terminal)", () => {
    expect(canTransitionStatus("completed", "pending")).toBe(false);
    expect(canTransitionStatus("completed", "canceled")).toBe(false);
  });
  it("permite reabrir um cancelado ou não-comparecimento para pending", () => {
    expect(canTransitionStatus("canceled", "pending")).toBe(true);
    expect(canTransitionStatus("no_show", "pending")).toBe(true);
  });
  it("não permite pending -> completed diretamente (deve passar por confirmed)", () => {
    expect(canTransitionStatus("pending", "completed")).toBe(false);
  });
});
