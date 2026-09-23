"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { manualAppointmentSchema, updateStatusSchema, rescheduleSchema } from "@/lib/validation/appointment";
import {
  createManualAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  schedulePendingReturn,
  BookingError,
} from "@/server/appointments";
import { parseDateKey, zonedTimeToUtc } from "@/lib/timezone";

function errorRedirect(basePath: string, message: string): never {
  redirect(`${basePath}?erro=${encodeURIComponent(message)}`);
}

export async function createManualAppointmentAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const parsed = manualAppointmentSchema.safeParse({
    serviceId: formData.get("serviceId"),
    dateKey: formData.get("dateKey"),
    time: formData.get("time"),
    customerName: formData.get("customerName"),
    customerWhatsapp: formData.get("customerWhatsapp"),
    customerEmail: formData.get("customerEmail") ?? "",
    origin: formData.get("origin"),
    publicNote: formData.get("publicNote") ?? "",
    internalNote: formData.get("internalNote") ?? "",
    status: formData.get("status"),
  });

  if (!parsed.success) {
    errorRedirect("/admin/agendamentos/novo", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const { year, month, day } = parseDateKey(parsed.data.dateKey);
  const [hour, minute] = parsed.data.time.split(":").map(Number);
  const startAtIso = zonedTimeToUtc({ year, month, day, hour, minute }).toISOString();

  try {
    const appointment = await createManualAppointment({
      serviceId: parsed.data.serviceId,
      dateKey: parsed.data.dateKey,
      startAtIso,
      customerName: parsed.data.customerName,
      customerWhatsapp: parsed.data.customerWhatsapp,
      status: parsed.data.status,
      origin: parsed.data.origin,
      customerEmail: parsed.data.customerEmail || null,
      publicNote: parsed.data.publicNote || null,
      internalNote: parsed.data.internalNote || null,
      userId: user.id,
    });
    revalidatePath("/admin/agendamentos");
    revalidatePath("/admin/agenda");
    redirect(`/admin/agendamentos/${appointment.id}`);
  } catch (error) {
    if (error instanceof BookingError) {
      errorRedirect("/admin/agendamentos/novo", `Não foi possível agendar: ${error.reason}`);
    }
    throw error;
  }
}

export async function updateAppointmentStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = updateStatusSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    toStatus: formData.get("toStatus"),
    note: formData.get("note"),
  });
  if (!parsed.success) return;

  const returnTo = (formData.get("returnTo") as string | null) || `/admin/agendamentos/${parsed.data.appointmentId}`;

  try {
    await updateAppointmentStatus({
      id: parsed.data.appointmentId,
      toStatus: parsed.data.toStatus,
      note: parsed.data.note || undefined,
      userId: user.id,
    });
  } catch {
    errorRedirect(returnTo, "Não foi possível atualizar o status.");
  }

  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin/agenda");
  revalidatePath(`/admin/agendamentos/${parsed.data.appointmentId}`);
  redirect(returnTo);
}

export async function rescheduleAppointmentAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = rescheduleSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    dateKey: formData.get("dateKey"),
    time: formData.get("time"),
  });
  if (!parsed.success) {
    errorRedirect(`/admin/agendamentos/${formData.get("appointmentId")}`, "Dados de remarcação inválidos.");
  }

  const { year, month, day } = parseDateKey(parsed.data.dateKey);
  const [hour, minute] = parsed.data.time.split(":").map(Number);
  const startAtIso = zonedTimeToUtc({ year, month, day, hour, minute }).toISOString();

  try {
    await rescheduleAppointment({
      id: parsed.data.appointmentId,
      dateKey: parsed.data.dateKey,
      startAtIso,
      userId: user.id,
    });
  } catch (error) {
    const message = error instanceof BookingError ? `Conflito: ${error.reason}` : "Não foi possível remarcar.";
    errorRedirect(`/admin/agendamentos/${parsed.data.appointmentId}`, message);
  }

  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin/agenda");
  revalidatePath(`/admin/agendamentos/${parsed.data.appointmentId}`);
  redirect(`/admin/agendamentos/${parsed.data.appointmentId}?avisar=1`);
}

export async function schedulePendingReturnAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = rescheduleSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    dateKey: formData.get("dateKey"),
    time: formData.get("time"),
  });
  const parentId = String(formData.get("appointmentId") ?? "");
  if (!parsed.success) {
    errorRedirect(`/admin/agendamentos/${parentId}`, "Dados do retorno inválidos.");
  }

  const { year, month, day } = parseDateKey(parsed.data.dateKey);
  const [hour, minute] = parsed.data.time.split(":").map(Number);
  const startAtIso = zonedTimeToUtc({ year, month, day, hour, minute }).toISOString();

  let createdId = "";
  try {
    const created = await schedulePendingReturn({
      parentId: parsed.data.appointmentId,
      dateKey: parsed.data.dateKey,
      startAtIso,
      userId: user.id,
    });
    createdId = created.id;
  } catch (error) {
    const message = error instanceof BookingError ? `Conflito: ${error.reason}` : "Não foi possível marcar o retorno.";
    errorRedirect(`/admin/agendamentos/${parentId}`, message);
  }

  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin/agenda");
  revalidatePath(`/admin/agendamentos/${parentId}`);
  redirect(`/admin/agendamentos/${createdId}?avisar=1`);
}
