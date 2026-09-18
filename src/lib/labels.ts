export const INCOME_CATEGORY_LABELS: Record<string, string> = {
  servico: "Serviço",
  sinal: "Sinal",
  retoque: "Retoque",
  outro: "Outro",
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  materiais: "Materiais",
  aluguel: "Aluguel",
  marketing: "Marketing",
  taxas: "Taxas",
  transporte: "Transporte",
  salarios_comissoes: "Salários/Comissões",
  manutencao: "Manutenção",
  impostos: "Impostos",
  outro: "Outro",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
  outro: "Outro",
};

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
};

export function categoryLabel(category: string): string {
  return INCOME_CATEGORY_LABELS[category] ?? EXPENSE_CATEGORY_LABELS[category] ?? category;
}
