import { describe, it, expect } from "vitest";
import { formatCentsToBRL, centsFromReais, sumCents } from "../money";

describe("money (sempre em centavos, nunca float)", () => {
  it("formata centavos como BRL em pt-BR", () => {
    expect(formatCentsToBRL(65000)).toBe("R$ 650,00");
    expect(formatCentsToBRL(0)).toBe("R$ 0,00");
    expect(formatCentsToBRL(9)).toBe("R$ 0,09");
  });

  it("converte reais em centavos sem erro de arredondamento binário", () => {
    expect(centsFromReais(650)).toBe(65000);
    expect(centsFromReais(9.9)).toBe(990);
  });

  it("soma uma lista de valores em centavos", () => {
    expect(sumCents([100, 200, 300])).toBe(600);
    expect(sumCents([])).toBe(0);
  });
});
