import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { anamneses, appointments, customers, type AnamnesisStatus } from "@/db/schema";
import { buildPrefill, emptyAnamnesis, type AnamnesisPayload, type CustomerIdentity } from "@/lib/anamnesis";
import { isCanonicalWhatsapp, whatsappToCanonical } from "@/lib/masks";
import { todayDateKey } from "@/lib/timezone";
import { anamnesisCompleteSchema, anamnesisPayloadSchema, readStoredPayload } from "@/lib/validation/anamnesis";

export type SaveAnamnesisResult =
  | { ok: true; status: AnamnesisStatus }
  | { ok: false; message: string };

function identityOf(customer: {
  name: string;
  whatsapp: string;
  birthDate: string | null;
  rg: string | null;
  cpf: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
}): CustomerIdentity {
  return customer;
}

export async function getAnamnesisScreen(appointmentId: string) {
  const [row] = await db
    .select({ appointment: appointments, customer: customers })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!row) return null;

  const [current] = await db
    .select()
    .from(anamneses)
    .where(eq(anamneses.appointmentId, appointmentId))
    .limit(1);

  const [previous] = current
    ? []
    : await db
        .select()
        .from(anamneses)
        .where(and(eq(anamneses.customerId, row.customer.id), ne(anamneses.appointmentId, appointmentId)))
        .orderBy(desc(anamneses.updatedAt))
        .limit(1);

  const payload = buildPrefill({
    customer: identityOf(row.customer),
    current: current ? readStoredPayload(current.payload) ?? emptyAnamnesis() : null,
    previous: previous ? readStoredPayload(previous.payload) : null,
  });

  return {
    appointment: row.appointment,
    customer: row.customer,
    payload,
    status: current?.status ?? null,
  };
}

export async function getAnamnesisStatus(appointmentId: string): Promise<AnamnesisStatus | null> {
  const [row] = await db
    .select({ status: anamneses.status })
    .from(anamneses)
    .where(eq(anamneses.appointmentId, appointmentId))
    .limit(1);
  return row?.status ?? null;
}

export async function listCustomerAnamneses(customerId: string) {
  return db
    .select({
      id: anamneses.id,
      appointmentId: anamneses.appointmentId,
      status: anamneses.status,
      updatedAt: anamneses.updatedAt,
      completedAt: anamneses.completedAt,
      protocol: appointments.protocol,
      serviceName: appointments.serviceNameSnapshot,
      startAtUtc: appointments.startAtUtc,
    })
    .from(anamneses)
    .innerJoin(appointments, eq(anamneses.appointmentId, appointments.id))
    .where(eq(anamneses.customerId, customerId))
    .orderBy(desc(anamneses.updatedAt));
}

export async function getAnamnesisPdfSource(appointmentId: string) {
  const [row] = await db
    .select({
      payload: anamneses.payload,
      status: anamneses.status,
      protocol: appointments.protocol,
      serviceName: appointments.serviceNameSnapshot,
      startAtUtc: appointments.startAtUtc,
    })
    .from(anamneses)
    .innerJoin(appointments, eq(anamneses.appointmentId, appointments.id))
    .where(eq(anamneses.appointmentId, appointmentId))
    .limit(1);

  if (!row) return null;
  const payload = readStoredPayload(row.payload);
  if (!payload) return null;
  return { ...row, payload };
}

function customerPatch(payload: AnamnesisPayload) {
  const canonical = whatsappToCanonical(payload.client.phone);
  return {
    ...(payload.client.name.trim().length >= 2 ? { name: payload.client.name.trim() } : {}),
    ...(isCanonicalWhatsapp(canonical) ? { whatsapp: canonical } : {}),
    birthDate: payload.client.birthDate || null,
    rg: payload.client.rg || null,
    cpf: payload.client.cpf || null,
    address: payload.client.address || null,
    city: payload.client.city || null,
    state: payload.client.state || null,
    updatedAt: new Date(),
  };
}

export async function saveAnamnesis(input: {
  appointmentId: string;
  mode: "draft" | "complete";
  payload: unknown;
}): Promise<SaveAnamnesisResult> {
  const parsed =
    input.mode === "complete"
      ? anamnesisCompleteSchema.safeParse(input.payload)
      : anamnesisPayloadSchema.safeParse(input.payload);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const payload = parsed.data as AnamnesisPayload;
  const [appointment] = await db
    .select({ id: appointments.id, customerId: appointments.customerId })
    .from(appointments)
    .where(eq(appointments.id, input.appointmentId))
    .limit(1);

  if (!appointment) return { ok: false, message: "Agendamento não encontrado." };

  const status: AnamnesisStatus = input.mode === "complete" ? "completed" : "draft";
  const stored: AnamnesisPayload = {
    ...payload,
    signedAt: status === "completed" ? todayDateKey() : payload.signedAt,
  };
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.update(customers).set(customerPatch(stored)).where(eq(customers.id, appointment.customerId));

    const [existing] = await tx
      .select({ id: anamneses.id })
      .from(anamneses)
      .where(eq(anamneses.appointmentId, appointment.id))
      .limit(1);

    if (existing) {
      await tx
        .update(anamneses)
        .set({
          customerId: appointment.customerId,
          status,
          payload: JSON.stringify(stored),
          completedAt: status === "completed" ? now : null,
          updatedAt: now,
        })
        .where(eq(anamneses.id, existing.id));
      return;
    }

    await tx.insert(anamneses).values({
      id: randomUUID(),
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      status,
      payload: JSON.stringify(stored),
      completedAt: status === "completed" ? now : null,
      createdAt: now,
      updatedAt: now,
    });
  });

  return { ok: true, status };
}
