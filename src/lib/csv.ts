export type CsvColumn<T> = { header: string; value: (row: T) => string | number };

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Gera um CSV (separado por vírgula, com BOM) a partir de linhas tipadas. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvCell(c.value(row))).join(",")
  );
  return ["﻿" + header, ...lines].join("\r\n");
}
