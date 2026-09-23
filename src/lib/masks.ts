export function maskWhatsapp(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length < 3) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

export function whatsappToCanonical(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(0, 13);
  else digits = `55${digits.slice(0, 11)}`;
  return digits;
}

export function isCanonicalWhatsapp(value: string): boolean {
  return /^55\d{10,11}$/.test(value);
}

export function maskBrlFromDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  const padded = digits.padStart(3, "0");
  const cents = padded.slice(-2);
  const reais = padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${reais},${cents}`;
}

export function centsToBrlInput(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.max(0, Math.round(cents)) : 0;
  return maskBrlFromDigits(String(safe));
}

export function parseBrlToCents(masked: string): number | null {
  const cleaned = masked.replace(/[^\d,]/g, "");
  if (!cleaned) return 0;
  const [reaisPart, centsPart = "00"] = cleaned.split(",");
  if (cleaned.split(",").length > 2) return null;
  if (!/^\d*$/.test(reaisPart) || !/^\d{0,2}$/.test(centsPart)) return null;
  const reais = reaisPart === "" ? 0 : Number(reaisPart);
  const cents = Number((centsPart + "00").slice(0, 2));
  if (!Number.isFinite(reais) || !Number.isFinite(cents)) return null;
  return reais * 100 + cents;
}

export function maskSlug(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-/, "")
    .slice(0, 80);
}
