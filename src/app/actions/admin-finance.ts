"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { transactionSchema, registerPaymentSchema } from "@/lib/validation/transaction";
import { createTransaction, registerAppointmentPayment } from "@/server/finance";
import { parseDateKey, zonedTimeToUtc } from "@/lib/timezone";

function errorRedirect(basePath: string, message: string): never {
  const separator = basePath.includes("?") ? "&" : "?";
  redirect(`${basePath}${separator}erro=${encodeURIComponent(message)}`);
}

function dateKeyToNoonUtc(dateKeyValue: string) {
  const { year, month, day } = parseDateKey(dateKeyValue);
  return zonedTimeToUtc({ year, month, day, hour: 12, minute: 0 });
}

export async function createTransactionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    amountCents: formData.get("amountCents"),
    financialDate: formData.get("financialDate"),
    category: formData.get("category"),
    description: formData.get("description"),
    note: formData.get("note"),
    paymentMethod: formData.get("paymentMethod"),
    status: formData.get("status"),
    appointmentId: formData.get("appointmentId"),
    serviceId: formData.get("serviceId"),
  });

  if (!parsed.success) {
    errorRedirect("/admin/financeiro", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  await createTransaction({
    type: parsed.data.type,
    amountCents: parsed.data.amountCents,
    financialDate: dateKeyToNoonUtc(parsed.data.financialDate),
    category: parsed.data.category,
    description: parsed.data.description || null,
    note: parsed.data.note || null,
    paymentMethod: parsed.data.paymentMethod,
    status: parsed.data.status,
    appointmentId: parsed.data.appointmentId || null,
    serviceId: parsed.data.serviceId || null,
    userId: user.id,
  });

  revalidatePath("/admin/financeiro");
  revalidatePath("/admin");
  redirect("/admin/financeiro");
}

export async function registerPaymentAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = registerPaymentSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    amountCents: formData.get("amountCents"),
    paymentMethod: formData.get("paymentMethod"),
    financialDate: formData.get("financialDate"),
    note: formData.get("note"),
    idempotencyKey: formData.get("idempotencyKey") || randomUUID(),
  });

  const fallback = `/admin/agendamentos/${formData.get("appointmentId")}`;
  const requestedReturn = formData.get("returnTo");
  const returnTo =
    typeof requestedReturn === "string" &&
    requestedReturn.startsWith("/admin") &&
    !requestedReturn.startsWith("//") &&
    !requestedReturn.includes("://")
      ? requestedReturn
      : fallback;

  if (!parsed.success) {
    errorRedirect(returnTo, parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  await registerAppointmentPayment({
    appointmentId: parsed.data.appointmentId,
    amountCents: parsed.data.amountCents,
    paymentMethod: parsed.data.paymentMethod,
    financialDate: dateKeyToNoonUtc(parsed.data.financialDate),
    note: parsed.data.note || null,
    idempotencyKey: parsed.data.idempotencyKey,
    userId: user.id,
  });

  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin");
  revalidatePath(returnTo);
  redirect(returnTo);
}
