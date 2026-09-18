import { z } from "zod";
import { APPOINTMENT_STATUSES, APPOINTMENT_ORIGINS } from "@/db/schema";

export const manualAppointmentSchema = z.object({
  serviceId: z.string().min(1, "Selecione um procedimento"),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Informe um horário válido"),
  customerName: z.string().trim().min(2, "Informe o nome do cliente").max(120),
  customerWhatsapp: z.string().trim().min(8, "Informe um WhatsApp válido").max(30),
  customerEmail: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
  origin: z.enum(APPOINTMENT_ORIGINS),
  publicNote: z.string().trim().max(500).optional().or(z.literal("")),
  internalNote: z.string().trim().max(1000).optional().or(z.literal("")),
  status: z.enum(APPOINTMENT_STATUSES).default("pending"),
});

export type ManualAppointmentInput = z.infer<typeof manualAppointmentSchema>;

// Transições de status permitidas. Evita, por exemplo, "reabrir" um
// agendamento cancelado diretamente para "concluído" sem passar por um novo
// agendamento, e evita mudar o status de algo já concluído/cancelado sem
// intenção explícita.
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "canceled", "no_show"],
  confirmed: ["completed", "canceled", "no_show", "pending"],
  completed: [],
  canceled: ["pending"],
  no_show: ["pending"],
};

export function canTransitionStatus(from: string, to: string): boolean {
  if (from === to) return false;
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export const updateStatusSchema = z.object({
  appointmentId: z.string().min(1),
  toStatus: z.enum(APPOINTMENT_STATUSES),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const rescheduleSchema = z.object({
  appointmentId: z.string().min(1),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Informe um horário válido"),
});

export type RescheduleInput = z.infer<typeof rescheduleSchema>;
