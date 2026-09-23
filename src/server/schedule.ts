import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, gte, lte, inArray } from "drizzle-orm";
import { db, type DbExecutor } from "@/db/client";
import {
  businessHours,
  blockedPeriods,
  appointments,
  OCCUPYING_STATUSES,
  type BusinessHour,
  type BlockedPeriod,
} from "@/db/schema";
import type { BusinessHourRule, TimeRange } from "@/lib/availability";

// Cada função aceita um `executor` (o `db` normal, ou o `tx` de uma
// transação em andamento). Isso é essencial: chamar o `db` "de fora" de
// dentro de um `db.transaction(...)` reabre uma segunda conexão/consulta
// concorrente, o que trava (ou corrompe a leitura) em SQLite/libSQL, que só
// permite uma operação por vez sobre a mesma conexão em transação.
export async function getBusinessHourRules(executor: DbExecutor = db): Promise<BusinessHourRule[]> {
  const rows: BusinessHour[] = await executor.select().from(businessHours);
  return rows.map((r) => ({
    weekday: r.weekday,
    isClosed: r.isClosed,
    openMinute: r.openMinute,
    closeMinute: r.closeMinute,
  }));
}

export async function getBlockedPeriodsBetween(
  start: Date,
  end: Date,
  executor: DbExecutor = db
): Promise<TimeRange[]> {
  const rows: BlockedPeriod[] = await executor
    .select()
    .from(blockedPeriods)
    .where(and(lte(blockedPeriods.startAt, end), gte(blockedPeriods.endAt, start)));
  return rows.map((r) => ({ start: r.startAt, end: r.endAt }));
}

export async function getOccupiedRangesBetween(
  start: Date,
  end: Date,
  executor: DbExecutor = db
): Promise<TimeRange[]> {
  const rows = await executor
    .select({ startAtUtc: appointments.startAtUtc, endAtUtc: appointments.endAtUtc })
    .from(appointments)
    .where(
      and(
        lte(appointments.startAtUtc, end),
        gte(appointments.endAtUtc, start),
        inArray(appointments.status, OCCUPYING_STATUSES),
        eq(appointments.isDemo, false)
      )
    );
  return rows.map((r) => ({ start: r.startAtUtc, end: r.endAtUtc }));
}

export async function listAllBlockedPeriods(): Promise<BlockedPeriod[]> {
  return db.select().from(blockedPeriods).orderBy(blockedPeriods.startAt);
}

export async function createBlockedPeriod(input: {
  startAt: Date;
  endAt: Date;
  reason?: string;
}): Promise<BlockedPeriod> {
  const [row] = await db
    .insert(blockedPeriods)
    .values({
      id: randomUUID(),
      startAt: input.startAt,
      endAt: input.endAt,
      reason: input.reason || null,
      createdAt: new Date(),
    })
    .returning();
  return row;
}

export async function deleteBlockedPeriod(id: string): Promise<void> {
  await db.delete(blockedPeriods).where(eq(blockedPeriods.id, id));
}

export async function upsertBusinessHourRule(rule: BusinessHourRule): Promise<void> {
  await db
    .insert(businessHours)
    .values(rule)
    .onConflictDoUpdate({ target: businessHours.weekday, set: rule });
}
