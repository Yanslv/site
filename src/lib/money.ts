// Toda quantia monetária é armazenada e calculada em centavos (inteiros),
// nunca em float, para evitar erros de arredondamento em somas financeiras.

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCentsToBRL(cents: number): string {
  return brl.format(cents / 100);
}

export function centsFromReais(reais: number): number {
  return Math.round(reais * 100);
}

export function sumCents(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
