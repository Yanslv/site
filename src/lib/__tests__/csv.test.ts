import { describe, it, expect } from "vitest";
import { toCsv } from "../csv";

type Row = { name: string; amount: number };

describe("toCsv", () => {
  it("gera cabeçalho e linhas separadas por vírgula", () => {
    const rows: Row[] = [
      { name: "Materiais", amount: 350 },
      { name: "Aluguel", amount: 800 },
    ];
    const csv = toCsv(rows, [
      { header: "Categoria", value: (r) => r.name },
      { header: "Valor", value: (r) => r.amount },
    ]);
    const lines = csv.replace(/^﻿/, "").split("\r\n");
    expect(lines[0]).toBe("Categoria,Valor");
    expect(lines[1]).toBe("Materiais,350");
    expect(lines[2]).toBe("Aluguel,800");
  });

  it("escapa valores contendo vírgula, aspas ou quebra de linha", () => {
    const rows = [{ name: 'Serviço, "premium"\nespecial', amount: 100 }];
    const csv = toCsv(rows, [
      { header: "Nome", value: (r) => r.name },
      { header: "Valor", value: (r) => r.amount },
    ]);
    expect(csv).toContain('"Serviço, ""premium""\nespecial"');
  });
});
