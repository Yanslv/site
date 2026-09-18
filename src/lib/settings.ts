import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { settings } from "@/db/schema";

const AUTO_CONFIRM_KEY = "autoConfirmAppointments";

export async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

/**
 * Se true, agendamentos públicos entrariam como "confirmed" automaticamente.
 * No ambiente demo o valor padrão é sempre `false` (a proprietária confirma
 * manualmente), mesmo que a variável de ambiente AUTO_CONFIRM_APPOINTMENTS
 * não esteja definida.
 */
export async function getAutoConfirmAppointments(): Promise<boolean> {
  const stored = await getSetting(AUTO_CONFIRM_KEY);
  if (stored !== null) return stored === "true";
  return process.env.AUTO_CONFIRM_APPOINTMENTS === "true";
}

export async function setAutoConfirmAppointments(value: boolean): Promise<void> {
  await setSetting(AUTO_CONFIRM_KEY, value ? "true" : "false");
}
