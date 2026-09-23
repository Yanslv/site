import { z } from "zod";
import { APPOINTMENT_STATUSES, APPOINTMENT_ORIGINS } from "@/db/schema";
import { whatsappField } from "@/lib/validation/booking";

const formText = (max: number) =>
  z.preprocess((value) => (value == null ? "" : value), z.string().trim().max(max));

const formEmail = z.preprocess(
  (value) => (value == null ? "" : value),
  z.union([z.literal(""), z.string().trim().email("E-mail inválido")])
);

export const manualAppointmentSchema = z.object({
  serviceId: z.string().min(1, "Selecione um procedimento"),
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Informe um horário válido")
    .transform((value) => value.slice(0, 5)),
  customerName: z.string().trim().min(2, "Informe o nome do cliente").max(120),
  customerWhatsapp: whatsappField,
  customerEmail: formEmail,
  origin: z.enum(APPOINTMENT_ORIGINS, { error: "Selecione a origem" }),
  publicNote: formText(500),
  internalNote: formText(1000),
  status: z.enum(APPOINTMENT_STATUSES, { error: "Selecione o status" }).default("pending"),
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
  time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Informe um horário válido")
    .transform((value) => value.slice(0, 5)),
});

export type RescheduleInput = z.infer<typeof rescheduleSchema>;
