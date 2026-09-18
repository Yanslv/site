/** Monta um link wa.me para um número de telefone específico (uso no painel, para falar com a cliente). */
export function buildCustomerWhatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
