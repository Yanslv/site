import { describe, it, expect } from "vitest";
import {
  zonedTimeToUtc,
  utcToZonedParts,
  dateKey,
  parseDateKey,
  addDaysToDateKey,
  compareDateKeys,
  BUSINESS_TIMEZONE,
} from "../timezone";

describe("timezone: America/Cuiaba (UTC-4, sem horário de verão)", () => {
  it("converte horário de parede local para o instante UTC correto", () => {
    const utc = zonedTimeToUtc({ year: 2026, month: 1, day: 15, hour: 9, minute: 0 }, BUSINESS_TIMEZONE);
    expect(utc.toISOString()).toBe("2026-01-15T13:00:00.000Z");
  });

  it("decompõe um instante UTC nos campos de calendário do fuso de negócio", () => {
    const parts = utcToZonedParts(new Date("2026-01-15T13:00:00.000Z"), BUSINESS_TIMEZONE);
    expect(parts).toMatchObject({ year: 2026, month: 1, day: 15, hour: 9, minute: 0 });
  });

  it("faz o roundtrip zonedTimeToUtc -> utcToZonedParts sem perda", () => {
    const wallClock = { year: 2026, month: 6, day: 3, hour: 17, minute: 45 };
    const utc = zonedTimeToUtc(wallClock, BUSINESS_TIMEZONE);
    const parts = utcToZonedParts(utc, BUSINESS_TIMEZONE);
    expect(parts).toMatchObject(wallClock);
  });

  it("calcula o dia da semana corretamente a partir da data civil", () => {
    // 2026-01-15 é uma quinta-feira (weekday 4).
    const parts = utcToZonedParts(zonedTimeToUtc({ year: 2026, month: 1, day: 15, hour: 12, minute: 0 }));
    expect(parts.weekday).toBe(4);
  });
});

describe("dateKey helpers", () => {
  it("formata e reconstrói uma dateKey", () => {
    const key = dateKey({ year: 2026, month: 3, day: 5 });
    expect(key).toBe("2026-03-05");
    expect(parseDateKey(key)).toEqual({ year: 2026, month: 3, day: 5 });
  });

  it("soma dias corretamente através de limites de mês", () => {
    expect(addDaysToDateKey("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDaysToDateKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("compara dateKeys em ordem lexicográfica/cronológica", () => {
    expect(compareDateKeys("2026-01-01", "2026-02-01")).toBeLessThan(0);
    expect(compareDateKeys("2026-02-01", "2026-01-01")).toBeGreaterThan(0);
    expect(compareDateKeys("2026-01-01", "2026-01-01")).toBe(0);
  });
});
