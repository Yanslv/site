import { describe, expect, it } from "vitest";
import { addMonthsToDateKey, formatReturnInterval, plannedReturnInstant } from "../return-visit";
import { zonedTimeToUtc } from "../timezone";

describe("prazo de retorno", () => {
  it("soma dias e meses e limita o dia quando o mês é mais curto", () => {
    expect(addMonthsToDateKey("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsToDateKey("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonthsToDateKey("2026-11-15", 3)).toBe("2027-02-15");
  });

  it("mantém o horário de parede do procedimento", () => {
    const start = zonedTimeToUtc({ year: 2026, month: 3, day: 10, hour: 15, minute: 30 });
    const planned = plannedReturnInstant(start, 2, "months");
    expect(planned.toISOString()).toBe("2026-05-10T19:30:00.000Z");
  });

  it("escreve o prazo em português", () => {
    expect(formatReturnInterval(1, "days")).toBe("1 dia");
    expect(formatReturnInterval(45, "days")).toBe("45 dias");
    expect(formatReturnInterval(1, "months")).toBe("1 mês");
    expect(formatReturnInterval(3, "months")).toBe("3 meses");
  });
});
