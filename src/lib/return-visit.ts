import {
  addDaysToDateKey,
  addMinutes,
  dateKey,
  formatZonedDate,
  formatZonedTime,
  parseDateKey,
  utcToZonedParts,
  zonedTimeToUtc,
} from "./timezone";
import {
  getDaySlots,
  validateRequestedSlot,
  type BusinessHourRule,
  type TimeRange,
} from "./availability";

export const RETURN_SEARCH_DAYS = 21;

export type ReturnUnit = "days" | "months";

export type ReturnSlot = {
  dateKey: string;
  startAtUtc: Date;
  endAtUtc: Date;
  adjusted: boolean;
};

export function formatReturnInterval(amount: number, unit: ReturnUnit): string {
  if (unit === "days") return amount === 1 ? "1 dia" : `${amount} dias`;
  return amount === 1 ? "1 mês" : `${amount} meses`;
}

export function addMonthsToDateKey(key: string, months: number): string {
  const { year, month, day } = parseDateKey(key);
  const monthIndex = month - 1 + months;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return dateKey({
    year: targetYear,
    month: targetMonth + 1,
    day: Math.min(day, lastDay),
  });
}

export function shiftDateKey(key: string, amount: number, unit: ReturnUnit): string {
  if (unit === "days") return addDaysToDateKey(key, amount);
  return addMonthsToDateKey(key, amount);
}

export function plannedReturnWallClock(
  procedureStart: Date,
  amount: number,
  unit: ReturnUnit,
): { dateKey: string; hour: number; minute: number } {
  const parts = utcToZonedParts(procedureStart);
  return {
    dateKey: shiftDateKey(dateKey(parts), amount, unit),
    hour: parts.hour,
    minute: parts.minute,
  };
}

export function plannedReturnInstant(procedureStart: Date, amount: number, unit: ReturnUnit): Date {
  const wall = plannedReturnWallClock(procedureStart, amount, unit);
  const { year, month, day } = parseDateKey(wall.dateKey);
  return zonedTimeToUtc({ year, month, day, hour: wall.hour, minute: wall.minute });
}

export function findReturnSlot(input: {
  procedureStart: Date;
  amount: number;
  unit: ReturnUnit;
  durationMinutes: number;
  businessHours: BusinessHourRule[];
  blockedPeriods: TimeRange[];
  occupiedRanges: TimeRange[];
  now?: Date;
}): { plannedAt: Date; slot: ReturnSlot | null } {
  const plannedAt = plannedReturnInstant(input.procedureStart, input.amount, input.unit);
  const wall = plannedReturnWallClock(input.procedureStart, input.amount, input.unit);
  const now = input.now ?? new Date();

  for (let offset = 0; offset <= RETURN_SEARCH_DAYS; offset += 1) {
    const candidateKey = addDaysToDateKey(wall.dateKey, offset);
    const { year, month, day } = parseDateKey(candidateKey);
    const startAtUtc = zonedTimeToUtc({ year, month, day, hour: wall.hour, minute: wall.minute });
    const validation = validateRequestedSlot({
      startAtUtc,
      dateKey: candidateKey,
      durationMinutes: input.durationMinutes,
      businessHours: input.businessHours,
      blockedPeriods: input.blockedPeriods,
      occupiedRanges: input.occupiedRanges,
      now,
      enforceBookingWindow: false,
      slotIntervalMinutes: 1,
    });
    if (!validation.ok) continue;
    return {
      plannedAt,
      slot: {
        dateKey: candidateKey,
        startAtUtc,
        endAtUtc: validation.endAtUtc,
        adjusted: startAtUtc.getTime() !== plannedAt.getTime(),
      },
    };
  }

  for (let offset = 0; offset <= RETURN_SEARCH_DAYS; offset += 1) {
    const candidateKey = addDaysToDateKey(wall.dateKey, offset);
    const free = getDaySlots({
      dateKey: candidateKey,
      durationMinutes: input.durationMinutes,
      businessHours: input.businessHours,
      blockedPeriods: input.blockedPeriods,
      occupiedRanges: input.occupiedRanges,
      now,
    }).find((slot) => slot.status === "available");
    if (!free) continue;
    return {
      plannedAt,
      slot: {
        dateKey: candidateKey,
        startAtUtc: free.startAtUtc,
        endAtUtc: free.endAtUtc,
        adjusted: true,
      },
    };
  }

  return { plannedAt, slot: null };
}

export function returnPreviewMessage(intervalLabel: string, plannedAt: Date): string {
  return `Este procedimento tem retorno em ${intervalLabel}. Ao solicitar, o retorno fica reservado em ${formatZonedDate(plannedAt)} às ${formatZonedTime(plannedAt)}, no mesmo horário. Se esse horário não estiver livre, marcamos o próximo disponível e avisamos na confirmação. Dá para remarcar com a Ioná.`;
}

export function returnSearchEndKey(plannedAt: Date): string {
  return addDaysToDateKey(dateKey(utcToZonedParts(plannedAt)), RETURN_SEARCH_DAYS);
}

export function returnRangeEnd(plannedAt: Date): Date {
  const endKey = returnSearchEndKey(plannedAt);
  const { year, month, day } = parseDateKey(endKey);
  return addMinutes(zonedTimeToUtc({ year, month, day, hour: 0, minute: 0 }), 24 * 60);
}
