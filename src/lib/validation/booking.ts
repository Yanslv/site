import { z } from "zod";
import { isCanonicalWhatsapp, whatsappToCanonical } from "@/lib/masks";

export const whatsappField = z
  .string()
  .trim()
  .transform(whatsappToCanonical)
  .refine(isCanonicalWhatsapp, "Informe um WhatsApp válido, com DDD");

export const publicBookingSchema = z.object({
  serviceId: z.string().min(1, "Selecione um procedimento"),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  startAtIso: z.string().min(1, "Selecione um horário"),
  customerName: z.string().trim().min(2, "Informe seu nome completo").max(120),
  customerWhatsapp: whatsappField,
  customerEmail: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  publicNote: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
