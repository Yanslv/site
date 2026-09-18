import { randomBytes } from "node:crypto";
import { utcToZonedParts, BUSINESS_TIMEZONE } from "./timezone";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I para evitar confusão

function randomCode(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/** Gera um protocolo legível, ex.: BM-20260918-7K4Q. */
export function generateProtocol(now: Date = new Date()): string {
  const { year, month, day } = utcToZonedParts(now, BUSINESS_TIMEZONE);
  const datePart = `${year}${month.toString().padStart(2, "0")}${day
    .toString()
    .padStart(2, "0")}`;
  return `BM-${datePart}-${randomCode(4)}`;
}
