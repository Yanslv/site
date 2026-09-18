import { z } from "zod";

const whatsappRegex = /^[0-9()+\-\s]{10,20}$/;

export const publicBookingSchema = z.object({
  serviceId: z.string().min(1, "Selecione um procedimento"),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  startAtIso: z.string().min(1, "Selecione um horário"),
  customerName: z.string().trim().min(2, "Informe seu nome completo").max(120),
  customerWhatsapp: z
    .string()
    .trim()
    .regex(whatsappRegex, "Informe um WhatsApp válido, com DDD"),
  customerEmail: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  publicNote: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
