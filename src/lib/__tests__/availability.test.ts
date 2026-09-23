import { describe, it, expect } from "vitest";
import {
  getAvailableSlotsForDay,
  getDaySlots,
  getCalendarDaySummary,
  validateRequestedSlot,
  type BusinessHourRule,
} from "../availability";
import { zonedTimeToUtc, BUSINESS_TIMEZONE } from "../timezone";

// Segunda a sexta 09:00-18:00, sábado 09:00-13:00, domingo fechado.
const BUSINESS_HOURS: BusinessHourRule[] = [
  { weekday: 0, isClosed: true, openMinute: null, closeMinute: null },
  { weekday: 1, isClosed: false, openMinute: 9 * 60, closeMinute: 18 * 60 },
  { weekday: 2, isClosed: false, openMinute: 9 * 60, closeMinute: 18 * 60 },
  { weekday: 3, isClosed: false, openMinute: 9 * 60, closeMinute: 18 * 60 },
  { weekday: 4, isClosed: false, openMinute: 9 * 60, closeMinute: 18 * 60 },
  { weekday: 5, isClosed: false, openMinute: 9 * 60, closeMinute: 18 * 60 },
  { weekday: 6, isClosed: false, openMinute: 9 * 60, closeMinute: 13 * 60 },
];

// 2026-01-19 é uma segunda-feira.
const MONDAY = "2026-01-19";
const SUNDAY = "2026-01-18";
const NOW = zonedTimeToUtc({ year: 2026, month: 1, day: 1, hour: 0, minute: 0 }, BUSINESS_TIMEZONE);

function wall(hour: number, minute = 0) {
  return zonedTimeToUtc({ year: 2026, month: 1, day: 19, hour, minute }, BUSINESS_TIMEZONE);
}

describe("getAvailableSlotsForDay", () => {
  it("não gera horários em um dia fechado (domingo)", () => {
    const slots = getAvailableSlotsForDay({
      dateKey: SUNDAY,
      durationMinutes: 60,
      businessHours: BUSINESS_HOURS,
      blockedPeriods: [],
      occupiedRanges: [],
      now: NOW,
    });
    expect(slots).toHaveLength(0);
  });

  it("gera slots de 15 em 15 minutos dentro do expediente, cabendo a duração inteira", () => {
    const slots = getAvailableSlotsForDay({
      dateKey: MONDAY,
      durationMinutes: 60,
      businessHours: BUSINESS_HOURS,
      blockedPeriods: [],
      occupiedRanges: [],
      now: NOW,
    });
    // Expediente 09:00-18:00 = 9h; último início possível para 60min é 17:00.
    expect(slots[0].startAtUtc.getTime()).toBe(wall(9, 0).getTime());
    expect(slots[slots.length - 1].startAtUtc.getTime()).toBe(wall(17, 0).getTime());
    expect(slots.every((s) => s.endAtUtc.getTime() <= wall(18, 0).getTime())).toBe(true);
  });

  it("não oferece um horário cuja duração ultrapasse o fechamento", () => {
    const slots = getAvailableSlotsForDay({
      dateKey: MONDAY,
      durationMinutes: 150, // Nano Fios
      businessHours: BUSINESS_HOURS,
      blockedPeriods: [],
      occupiedRanges: [],
      now: NOW,
    });
    // Último início possível: 18:00 - 150min = 15:30.
    const lastSlot = slots[slots.length - 1];
    expect(lastSlot.startAtUtc.getTime()).toBe(wall(15, 30).getTime());
  });

  it("remove horários que colidem com um bloqueio", () => {
    const slots = getAvailableSlotsForDay({
      dateKey: MONDAY,
      durationMinutes: 60,
      businessHours: BUSINESS_HOURS,
      blockedPeriods: [{ start: wall(10, 0), end: wall(12, 0) }],
      occupiedRanges: [],
      now: NOW,
    });
    const withinBlock = slots.some(
      (s) => s.startAtUtc.getTime() >= wall(10, 0).getTime() && s.startAtUtc.getTime() < wall(12, 0).getTime()
    );
    expect(withinBlock).toBe(false);
  });

  it("remove horários que colidem com um agendamento já ocupado", () => {
    const slots = getAvailableSlotsForDay({
      dateKey: MONDAY,
      durationMinutes: 60,
      businessHours: BUSINESS_HOURS,
      blockedPeriods: [],
      occupiedRanges: [{ start: wall(9, 0), end: wall(10, 30) }],
      now: NOW,
    });
    expect(slots.some((s) => s.startAtUtc.getTime() === wall(9, 0).getTime())).toBe(false);
    expect(slots.some((s) => s.startAtUtc.getTime() === wall(9, 15).getTime())).toBe(false);
    expect(slots.some((s) => s.startAtUtc.getTime() === wall(10, 30).getTime())).toBe(true);
  });

  it("marca horários ocupados e mantém os livres", () => {
    const slots = getDaySlots({
      dateKey: MONDAY,
      durationMinutes: 60,
      businessHours: BUSINESS_HOURS,
      blockedPeriods: [],
      occupiedRanges: [{ start: wall(9, 0), end: wall(10, 30) }],
      now: NOW,
    });
    expect(slots.find((s) => s.startAtUtc.getTime() === wall(9, 0).getTime())?.status).toBe("occupied");
    expect(slots.find((s) => s.startAtUtc.getTime() === wall(9, 15).getTime())?.status).toBe("occupied");
    expect(slots.find((s) => s.startAtUtc.getTime() === wall(10, 30).getTime())?.status).toBe("available");
  });

  it("marca bloqueio e horário passado como indisponível", () => {
    const slots = getDaySlots({
      dateKey: MONDAY,
      durationMinutes: 60,
      businessHours: BUSINESS_HOURS,
      blockedPeriods: [{ start: wall(14, 0), end: wall(16, 0) }],
      occupiedRanges: [],
      now: wall(12, 0),
    });
    expect(slots.find((s) => s.startAtUtc.getTime() === wall(11, 0).getTime())?.status).toBe("unavailable");
    expect(slots.find((s) => s.startAtUtc.getTime() === wall(14, 0).getTime())?.status).toBe("unavailable");
    expect(slots.find((s) => s.startAtUtc.getTime() === wall(16, 0).getTime())?.status).toBe("available");
  });

  it("resume o dia com contagem de livres e ocupados", () => {
    const summary = getCalendarDaySummary({
      dateKey: MONDAY,
      durationMinutes: 60,
      businessHours: BUSINESS_HOURS,
      blockedPeriods: [],
      occupiedRanges: [{ start: wall(9, 0), end: wall(10, 0) }],
      now: NOW,
    });
    expect(summary.isClosed).toBe(false);
    expect(summary.occupiedCount).toBeGreaterThan(0);
    expect(summary.availableCount).toBeGreaterThan(0);
  });

  it("marca domingo como fechado no resumo", () => {
    const summary = getCalendarDaySummary({
      dateKey: SUNDAY,
      durationMinutes: 60,
      businessHours: BUSINESS_HOURS,
      blockedPeriods: [],
      occupiedRanges: [],
      now: NOW,
    });
    expect(summary).toEqual({
      dateKey: SUNDAY,
      isClosed: true,
      availableCount: 0,
      occupiedCount: 0,
    });
  });

  it("não oferece horários no passado", () => {
    const slots = getAvailableSlotsForDay({
      dateKey: MONDAY,
      durationMinutes: 60,
      businessHours: BUSINESS_HOURS,
      blockedPeriods: [],
      occupiedRanges: [],
      now: wall(12, 0),
    });
    expect(slots.every((s) => s.startAtUtc.getTime() > wall(12, 0).getTime())).toBe(true);
  });
});

describe("validateRequestedSlot", () => {
  const baseInput = {
    dateKey: MONDAY,
    durationMinutes: 60,
    businessHours: BUSINESS_HOURS,
    blockedPeriods: [],
    occupiedRanges: [],
    now: NOW,
  };

  it("aceita um horário válido dentro do expediente", () => {
    const result = validateRequestedSlot({ ...baseInput, startAtUtc: wall(10, 0) });
    expect(result.ok).toBe(true);
  });

  it("rejeita horário no passado", () => {
    const result = validateRequestedSlot({ ...baseInput, startAtUtc: wall(10, 0), now: wall(11, 0) });
    expect(result).toEqual({ ok: false, reason: "in_the_past" });
  });

  it("rejeita horário fora do expediente (antes de abrir)", () => {
    const result = validateRequestedSlot({ ...baseInput, startAtUtc: wall(8, 0) });
    expect(result).toEqual({ ok: false, reason: "outside_business_hours" });
  });

  it("rejeita horário cuja duração ultrapassa o fechamento", () => {
    const result = validateRequestedSlot({ ...baseInput, startAtUtc: wall(17, 45) });
    expect(result).toEqual({ ok: false, reason: "outside_business_hours" });
  });

  it("rejeita horário em dia fechado (domingo)", () => {
    const result = validateRequestedSlot({ ...baseInput, dateKey: SUNDAY, startAtUtc: wall(10, 0) });
    expect(result).toEqual({ ok: false, reason: "outside_business_hours" });
  });

  it("rejeita horário desalinhado com o intervalo de slots (15min)", () => {
    const result = validateRequestedSlot({ ...baseInput, startAtUtc: wall(10, 7) });
    expect(result).toEqual({ ok: false, reason: "invalid_alignment" });
  });

  it("rejeita conflito com agendamento existente — corrida entre duas solicitações", () => {
    const result = validateRequestedSlot({
      ...baseInput,
      startAtUtc: wall(10, 0),
      occupiedRanges: [{ start: wall(9, 30), end: wall(10, 30) }],
    });
    expect(result).toEqual({ ok: false, reason: "conflict" });
  });

  it("rejeita conflito com bloqueio de agenda", () => {
    const result = validateRequestedSlot({
      ...baseInput,
      startAtUtc: wall(10, 0),
      blockedPeriods: [{ start: wall(9, 45), end: wall(10, 15) }],
    });
    expect(result).toEqual({ ok: false, reason: "conflict" });
  });

  it("rejeita datas além da janela de agendamento (60 dias)", () => {
    const farAway = zonedTimeToUtc({ year: 2026, month: 6, day: 1, hour: 10, minute: 0 }, BUSINESS_TIMEZONE);
    const result = validateRequestedSlot({
      ...baseInput,
      dateKey: "2026-06-01",
      startAtUtc: farAway,
    });
    expect(result).toEqual({ ok: false, reason: "outside_booking_window" });
  });

  it("permite desativar as checagens de futuro/janela para lançamentos manuais do painel", () => {
    const pastDate = zonedTimeToUtc({ year: 2020, month: 1, day: 6, hour: 10, minute: 0 }, BUSINESS_TIMEZONE);
    const result = validateRequestedSlot({
      ...baseInput,
      dateKey: "2020-01-06", // segunda-feira
      startAtUtc: pastDate,
      enforceFuture: false,
      enforceBookingWindow: false,
      slotIntervalMinutes: 1,
    });
    expect(result.ok).toBe(true);
  });
});
