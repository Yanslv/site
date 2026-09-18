// Utilitários de fuso horário sem dependência externa. Toda a lógica de
// disponibilidade e agendamento trabalha em instantes UTC internamente e só
// converte para o fuso de negócio (America/Cuiaba) na borda (exibição e
// entrada de formulário), conforme exigido pelo PRD.

export const BUSINESS_TIMEZONE = "America/Cuiaba";

export type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  weekday: number; // 0 (domingo) .. 6 (sábado)
};

function partsToMap(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return map;
}

/**
 * Deslocamento (em ms) do fuso `timeZone` em relação ao UTC, no instante
 * `instant`. Positivo a leste de UTC, negativo a oeste (Cuiaba = -4h).
 */
export function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map = partsToMap(dtf.formatToParts(instant));
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) === 24 ? 0 : Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return asUtc - instant.getTime();
}

/**
 * Converte um horário de parede (ano/mês/dia/hora/minuto) interpretado como
 * horário local de `timeZone` para o instante UTC correspondente.
 */
export function zonedTimeToUtc(
  wallClock: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string = BUSINESS_TIMEZONE
): Date {
  const guess = Date.UTC(
    wallClock.year,
    wallClock.month - 1,
    wallClock.day,
    wallClock.hour,
    wallClock.minute,
    0
  );
  const offset = getTimeZoneOffsetMs(new Date(guess), timeZone);
  return new Date(guess - offset);
}

/**
 * Decompõe um instante UTC nos campos de calendário/relógio de `timeZone`.
 */
export function utcToZonedParts(
  instant: Date,
  timeZone: string = BUSINESS_TIMEZONE
): ZonedParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const map = partsToMap(dtf.formatToParts(instant));
  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  const hour = map.hour === "24" ? 0 : Number(map.hour);
  const minute = Number(map.minute);
  // Dia da semana é uma função pura do calendário civil: uma vez com o
  // Y/M/D local em mãos, podemos usar Date.UTC(...).getUTCDay() com segurança.
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, hour, minute, weekday };
}

export function dateKey(parts: { year: number; month: number; day: number }): string {
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

export function parseDateKey(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

export function todayDateKey(timeZone: string = BUSINESS_TIMEZONE): string {
  return dateKey(utcToZonedParts(new Date(), timeZone));
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function addDaysToDateKey(key: string, days: number): string {
  const { year, month, day } = parseDateKey(key);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  return dateKey({
    year: base.getUTCFullYear(),
    month: base.getUTCMonth() + 1,
    day: base.getUTCDate(),
  });
}

export function compareDateKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BUSINESS_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BUSINESS_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BUSINESS_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatZonedDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatZonedTime(date: Date): string {
  return timeFormatter.format(date);
}

export function formatZonedDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}
