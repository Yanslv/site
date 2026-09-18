import {
  BUSINESS_TIMEZONE,
  addMinutes,
  parseDateKey,
  zonedTimeToUtc,
} from "./timezone";

export const SLOT_INTERVAL_MINUTES = 15;
export const BOOKING_WINDOW_DAYS = 60;

export type BusinessHourRule = {
  weekday: number; // 0-6, domingo=0
  isClosed: boolean;
  openMinute: number | null;
  closeMinute: number | null;
};

export type TimeRange = { start: Date; end: Date };

export type Slot = { startAtUtc: Date; endAtUtc: Date };

function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && a.end > b.start;
}

function weekdayForDateKey(key: string): number {
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/**
 * Gera os horários de início/fim (em UTC) do expediente de um dia, ou
 * `null` se a clínica estiver fechada nesse dia da semana.
 */
export function getBusinessWindowForDate(
  dateKeyValue: string,
  businessHours: BusinessHourRule[],
  timeZone: string = BUSINESS_TIMEZONE
): TimeRange | null {
  const weekday = weekdayForDateKey(dateKeyValue);
  const rule = businessHours.find((r) => r.weekday === weekday);
  if (!rule || rule.isClosed || rule.openMinute == null || rule.closeMinute == null) {
    return null;
  }
  const { year, month, day } = parseDateKey(dateKeyValue);
  const start = zonedTimeToUtc(
    { year, month, day, hour: Math.floor(rule.openMinute / 60), minute: rule.openMinute % 60 },
    timeZone
  );
  const end = zonedTimeToUtc(
    { year, month, day, hour: Math.floor(rule.closeMinute / 60), minute: rule.closeMinute % 60 },
    timeZone
  );
  return { start, end };
}

export type AvailabilityInput = {
  dateKey: string;
  durationMinutes: number;
  businessHours: BusinessHourRule[];
  blockedPeriods: TimeRange[];
  occupiedRanges: TimeRange[];
  now?: Date;
  timeZone?: string;
  slotIntervalMinutes?: number;
};

/** Lista os horários de início disponíveis para um dia (uso na UI de agendamento). */
export function getAvailableSlotsForDay(input: AvailabilityInput): Slot[] {
  const {
    dateKey: dateKeyValue,
    durationMinutes,
    businessHours,
    blockedPeriods,
    occupiedRanges,
    now = new Date(),
    timeZone = BUSINESS_TIMEZONE,
    slotIntervalMinutes = SLOT_INTERVAL_MINUTES,
  } = input;

  const window = getBusinessWindowForDate(dateKeyValue, businessHours, timeZone);
  if (!window) return [];

  const slots: Slot[] = [];
  let cursor = window.start;
  while (true) {
    const slotEnd = addMinutes(cursor, durationMinutes);
    if (slotEnd > window.end) break;

    const candidate: TimeRange = { start: cursor, end: slotEnd };
    const isPast = cursor.getTime() <= now.getTime();
    const isBlocked = blockedPeriods.some((block) => overlaps(candidate, block));
    const isTaken = occupiedRanges.some((range) => overlaps(candidate, range));

    if (!isPast && !isBlocked && !isTaken) {
      slots.push({ startAtUtc: cursor, endAtUtc: slotEnd });
    }

    cursor = addMinutes(cursor, slotIntervalMinutes);
  }

  return slots;
}

export type ValidateSlotInput = {
  startAtUtc: Date;
  dateKey: string;
  durationMinutes: number;
  businessHours: BusinessHourRule[];
  blockedPeriods: TimeRange[];
  occupiedRanges: TimeRange[];
  now?: Date;
  timeZone?: string;
  slotIntervalMinutes?: number;
  bookingWindowDays?: number;
  /** Desativado para lançamentos manuais do painel (ex.: registrar um atendimento presencial passado). */
  enforceFuture?: boolean;
  /** Desativado para lançamentos manuais do painel (agendamentos distantes registrados manualmente). */
  enforceBookingWindow?: boolean;
};

export type SlotValidationFailureReason =
  | "outside_business_hours"
  | "in_the_past"
  | "conflict"
  | "outside_booking_window"
  | "invalid_alignment";

export type SlotValidationResult =
  | { ok: true; endAtUtc: Date }
  | { ok: false; reason: SlotValidationFailureReason };

/**
 * Revalida, no servidor, se um horário específico solicitado pelo cliente
 * ainda está disponível. Deve ser chamada dentro da transação que cria o
 * agendamento — nunca confiar apenas na grade renderizada no navegador.
 */
export function validateRequestedSlot(input: ValidateSlotInput): SlotValidationResult {
  const {
    startAtUtc,
    dateKey: dateKeyValue,
    durationMinutes,
    businessHours,
    blockedPeriods,
    occupiedRanges,
    now = new Date(),
    timeZone = BUSINESS_TIMEZONE,
    slotIntervalMinutes = SLOT_INTERVAL_MINUTES,
    bookingWindowDays = BOOKING_WINDOW_DAYS,
    enforceFuture = true,
    enforceBookingWindow = true,
  } = input;

  if (enforceFuture && startAtUtc.getTime() <= now.getTime()) {
    return { ok: false, reason: "in_the_past" };
  }

  if (enforceBookingWindow) {
    const maxDate = addMinutes(now, bookingWindowDays * 24 * 60);
    if (startAtUtc.getTime() > maxDate.getTime()) {
      return { ok: false, reason: "outside_booking_window" };
    }
  }

  const window = getBusinessWindowForDate(dateKeyValue, businessHours, timeZone);
  if (!window) {
    return { ok: false, reason: "outside_business_hours" };
  }

  const endAtUtc = addMinutes(startAtUtc, durationMinutes);
  if (startAtUtc < window.start || endAtUtc > window.end) {
    return { ok: false, reason: "outside_business_hours" };
  }

  const minutesFromOpen = Math.round((startAtUtc.getTime() - window.start.getTime()) / 60_000);
  if (minutesFromOpen % slotIntervalMinutes !== 0) {
    return { ok: false, reason: "invalid_alignment" };
  }

  const candidate: TimeRange = { start: startAtUtc, end: endAtUtc };
  const hasBlockConflict = blockedPeriods.some((block) => overlaps(candidate, block));
  const hasAppointmentConflict = occupiedRanges.some((range) => overlaps(candidate, range));
  if (hasBlockConflict || hasAppointmentConflict) {
    return { ok: false, reason: "conflict" };
  }

  return { ok: true, endAtUtc };
}
