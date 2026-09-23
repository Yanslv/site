import { isCanonicalWhatsapp, whatsappToCanonical } from "@/lib/masks";

export function buildCustomerWhatsappLink(phone: string, message?: string): string {
  const canonical = whatsappToCanonical(phone);
  const digits = isCanonicalWhatsapp(canonical) ? canonical : phone.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function whatsappHref(input: { number: string; publicLink: string; message: string }): string {
  const digits = whatsappToCanonical(input.number);
  if (!isCanonicalWhatsapp(digits)) return input.publicLink;
  return `https://wa.me/${digits}?text=${encodeURIComponent(input.message)}`;
}
