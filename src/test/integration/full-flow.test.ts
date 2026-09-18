import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "node:path";

// Banco SQLite em memória (definido em src/test/setup.ts) — nunca toca
// ./data/local.db nem um banco Turso real.
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { createService } from "@/server/services";
import { upsertBusinessHourRule } from "@/server/schedule";
import { createPublicBooking, updateAppointmentStatus, BookingError } from "@/server/appointments";
import { registerAppointmentPayment } from "@/server/finance";
import { getOverviewMetrics } from "@/server/dashboard";
import { zonedTimeToUtc, BUSINESS_TIMEZONE } from "@/lib/timezone";

let testUserId: string;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../db/migrations") });

  // Expediente 24h todos os dias, para o teste não depender de qual dia da
  // semana é "amanhã" no momento em que a suíte roda.
  for (let weekday = 0; weekday <= 6; weekday++) {
    await upsertBusinessHourRule({ weekday, isClosed: false, openMinute: 0, closeMinute: 24 * 60 });
  }

  testUserId = randomUUID();
  await db.insert(users).values({
    id: testUserId,
    email: "owner@teste.local",
    passwordHash: await hashPassword("senha-de-teste"),
    name: "Proprietária de Teste",
    role: "owner",
    createdAt: new Date(),
  });
});

function tomorrowDateParts() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return {
    year: tomorrow.getUTCFullYear(),
    month: tomorrow.getUTCMonth() + 1,
    day: tomorrow.getUTCDate(),
  };
}

describe("fluxo completo: serviço → disponibilidade → agendamento → conclusão → pagamento → resumo mensal", () => {
  it("percorre o fluxo de ponta a ponta sem duplicar receita", async () => {
    const service = await createService({
      name: "Nano Fios (teste)",
      slug: `nano-fios-teste-${Date.now()}`,
      description: "",
      category: "sobrancelhas",
      durationMinutes: 60,
      priceCents: 65000,
      active: true,
      imagePath: "",
      color: "#7E3948",
      sortOrder: 1,
    });

    const { year, month, day } = tomorrowDateParts();
    const dateKeyValue = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const startAtUtc = zonedTimeToUtc({ year, month, day, hour: 10, minute: 0 }, BUSINESS_TIMEZONE);

    // 1. Disponibilidade + agendamento público (status inicial: pending).
    const { appointment, protocol } = await createPublicBooking({
      serviceId: service.id,
      dateKey: dateKeyValue,
      startAtIso: startAtUtc.toISOString(),
      customerName: "Cliente Teste",
      customerWhatsapp: "+55 65 90000-1234",
      customerEmail: null,
      publicNote: null,
    });

    expect(appointment.status).toBe("pending");
    expect(appointment.paymentStatus).toBe("unpaid");
    expect(protocol).toMatch(/^BM-\d{8}-[A-Z0-9]{4}$/);

    // 2. Conflito: uma segunda solicitação para o mesmo horário deve ser
    //    rejeitada (nunca confiar apenas no calendário do navegador).
    await expect(
      createPublicBooking({
        serviceId: service.id,
        dateKey: dateKeyValue,
        startAtIso: startAtUtc.toISOString(),
        customerName: "Outra Cliente",
        customerWhatsapp: "+55 65 90000-5678",
        customerEmail: null,
        publicNote: null,
      })
    ).rejects.toBeInstanceOf(BookingError);

    // 3. Transições de status: pending -> confirmed -> completed.
    await updateAppointmentStatus({ id: appointment.id, toStatus: "confirmed", userId: testUserId });
    const completed = await updateAppointmentStatus({
      id: appointment.id,
      toStatus: "completed",
      userId: testUserId,
    });
    expect(completed.status).toBe("completed");

    // Transição inválida deve falhar (completed é estado terminal).
    await expect(
      updateAppointmentStatus({ id: appointment.id, toStatus: "pending", userId: testUserId })
    ).rejects.toThrow();

    // 4. Pagamento parcial, depois complementar — idempotente.
    const idempotencyKey = `test-payment-${appointment.id}`;
    const firstPayment = await registerAppointmentPayment({
      appointmentId: appointment.id,
      amountCents: 65000,
      paymentMethod: "pix",
      financialDate: startAtUtc,
      idempotencyKey,
      userId: testUserId,
    });
    expect(firstPayment.paidCents).toBe(65000);
    expect(firstPayment.paymentStatus).toBe("paid");

    // Retry com a MESMA idempotencyKey (duplo clique/retry de rede): não
    // pode duplicar a receita.
    const retryPayment = await registerAppointmentPayment({
      appointmentId: appointment.id,
      amountCents: 65000,
      paymentMethod: "pix",
      financialDate: startAtUtc,
      idempotencyKey,
      userId: testUserId,
    });
    expect(retryPayment.paidCents).toBe(65000); // continua 65000, não 130000
    expect(retryPayment.transaction.id).toBe(firstPayment.transaction.id);

    // 5. Resumo mensal reflete a receita recebida.
    const periodStart = zonedTimeToUtc({ year, month, day: 1, hour: 0, minute: 0 }, BUSINESS_TIMEZONE);
    const nextMonthStart = zonedTimeToUtc(
      { year: month === 12 ? year + 1 : year, month: month === 12 ? 1 : month + 1, day: 1, hour: 0, minute: 0 },
      BUSINESS_TIMEZONE
    );
    const periodEnd = new Date(nextMonthStart.getTime() - 1000);
    const metrics = await getOverviewMetrics(periodStart, periodEnd);
    expect(metrics.grossRevenueCents).toBeGreaterThanOrEqual(65000);
  });
});
