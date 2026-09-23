import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { db, type DbExecutor } from "@/db/client";
import {
  appointments,
  appointmentEvents,
  customers,
  services,
  transactions,
  type Appointment,
  type AppointmentStatus,
  type AppointmentOrigin,
  type Service,
} from "@/db/schema";
import {
  getBusinessHourRules,
  getBlockedPeriodsBetween,
  getOccupiedRangesBetween,
} from "./schedule";
import { findOrCreateCustomer } from "./customers";
import { getAutoConfirmAppointments } from "@/lib/settings";
import { validateRequestedSlot, type SlotValidationFailureReason } from "@/lib/availability";
import { generateProtocol } from "@/lib/protocol";
import { canTransitionStatus } from "@/lib/validation/appointment";
import { parseDateKey, zonedTimeToUtc, addMinutes, BUSINESS_TIMEZONE, formatZonedDateTime } from "@/lib/timezone";
import { getServiceById } from "./services";
import { findReturnSlot, plannedReturnInstant, returnRangeEnd, type ReturnUnit } from "@/lib/return-visit";

export type BookingErrorReason = SlotValidationFailureReason | "service_unavailable";

export class BookingError extends Error {
  constructor(public reason: BookingErrorReason) {
    super(`booking_error:${reason}`);
  }
}

type CreateBookingInput = {
  serviceId: string;
  dateKey: string;
  startAtIso: string;
  customerName: string;
  customerWhatsapp: string;
  customerEmail?: string | null;
  publicNote?: string | null;
  origin?: AppointmentOrigin;
};

async function loadAvailabilityContext(dateKeyValue: string, executor: DbExecutor) {
  const { year, month, day } = parseDateKey(dateKeyValue);
  const dayStartUtc = zonedTimeToUtc({ year, month, day, hour: 0, minute: 0 }, BUSINESS_TIMEZONE);
  const dayEndUtc = addMinutes(dayStartUtc, 24 * 60);

  // Consultas sequenciais (não Promise.all): dentro de uma transação, a
  // conexão única do SQLite/libSQL não suporta consultas concorrentes.
  const businessHourRules = await getBusinessHourRules(executor);
  const blockedPeriods = await getBlockedPeriodsBetween(dayStartUtc, dayEndUtc, executor);
  const occupiedRanges = await getOccupiedRangesBetween(dayStartUtc, dayEndUtc, executor);

  return { businessHourRules, blockedPeriods, occupiedRanges };
}

async function attachReturnVisit(
  tx: DbExecutor,
  input: {
    parent: Appointment;
    service: Service;
    now: Date;
    userId: string | null;
  },
): Promise<void> {
  if (!input.service.hasReturn || !input.service.returnAmount || !input.service.returnUnit) return;

  const unit = input.service.returnUnit as ReturnUnit;
  const plannedAt = plannedReturnInstant(input.parent.startAtUtc, input.service.returnAmount, unit);
  const rangeEnd = returnRangeEnd(plannedAt);
  const businessHourRules = await getBusinessHourRules(tx);
  const blockedPeriods = await getBlockedPeriodsBetween(input.parent.startAtUtc, rangeEnd, tx);
  const occupiedRanges = await getOccupiedRangesBetween(input.parent.startAtUtc, rangeEnd, tx);
  const { slot } = findReturnSlot({
    procedureStart: input.parent.startAtUtc,
    amount: input.service.returnAmount,
    unit,
    durationMinutes: input.service.durationMinutes,
    businessHours: businessHourRules,
    blockedPeriods,
    occupiedRanges,
    now: input.now,
  });

  await tx
    .update(appointments)
    .set({ returnPlannedAt: plannedAt, updatedAt: input.now })
    .where(eq(appointments.id, input.parent.id));

  if (!slot) return;

  const returnId = randomUUID();
  const adjustedNote = slot.adjusted
    ? `Retorno automático. O horário previsto (${formatZonedDateTime(plannedAt)}) não estava livre. Reservamos ${formatZonedDateTime(slot.startAtUtc)} e a cliente foi avisada.`
    : `Retorno automático de ${input.service.name}, no mesmo horário do procedimento. A cliente foi avisada.`;

  await tx.insert(appointments).values({
    id: returnId,
    protocol: generateProtocol(input.now),
    customerId: input.parent.customerId,
    serviceId: input.service.id,
    serviceNameSnapshot: `Retorno — ${input.service.name}`,
    serviceDurationSnapshot: input.service.durationMinutes,
    servicePriceSnapshot: 0,
    startAtUtc: slot.startAtUtc,
    endAtUtc: slot.endAtUtc,
    timezone: BUSINESS_TIMEZONE,
    status: input.parent.status,
    paymentStatus: "paid",
    origin: input.parent.origin,
    internalNote: adjustedNote,
    kind: "return",
    parentAppointmentId: input.parent.id,
    returnAdjusted: slot.adjusted,
    isDemo: false,
    createdAt: input.now,
    updatedAt: input.now,
  });

  await tx.insert(appointmentEvents).values({
    id: randomUUID(),
    appointmentId: returnId,
    fromStatus: null,
    toStatus: input.parent.status,
    note: "Retorno reservado automaticamente a partir do procedimento.",
    createdByUserId: input.userId,
    createdAt: input.now,
  });
}

/** Cria um agendamento solicitado publicamente por uma cliente em `/agendar`. */
export async function createPublicBooking(
  input: CreateBookingInput
): Promise<{ appointment: Appointment; protocol: string }> {
  const service = await getServiceById(input.serviceId);
  if (!service || !service.active) {
    throw new BookingError("service_unavailable");
  }

  const customer = await findOrCreateCustomer({
    name: input.customerName,
    whatsapp: input.customerWhatsapp,
    email: input.customerEmail,
  });

  const startAtUtc = new Date(input.startAtIso);
  const autoConfirm = await getAutoConfirmAppointments();

  return db.transaction(
    async (tx) => {
      const { businessHourRules, blockedPeriods, occupiedRanges } =
        await loadAvailabilityContext(input.dateKey, tx);

      const validation = validateRequestedSlot({
        startAtUtc,
        dateKey: input.dateKey,
        durationMinutes: service.durationMinutes,
        businessHours: businessHourRules,
        blockedPeriods,
        occupiedRanges,
      });

      if (!validation.ok) {
        throw new BookingError(validation.reason);
      }

      const now = new Date();
      const id = randomUUID();
      const protocol = generateProtocol(now);

      const [appointment] = await tx
        .insert(appointments)
        .values({
          id,
          protocol,
          customerId: customer.id,
          serviceId: service.id,
          serviceNameSnapshot: service.name,
          serviceDurationSnapshot: service.durationMinutes,
          servicePriceSnapshot: service.priceCents,
          startAtUtc,
          endAtUtc: validation.endAtUtc,
          timezone: BUSINESS_TIMEZONE,
          status: autoConfirm ? "confirmed" : "pending",
          paymentStatus: "unpaid",
          origin: input.origin ?? "site",
          publicNote: input.publicNote || null,
          isDemo: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      await tx.insert(appointmentEvents).values({
        id: randomUUID(),
        appointmentId: id,
        fromStatus: null,
        toStatus: appointment.status,
        note: "Solicitado pela cliente via site.",
        createdByUserId: null,
        createdAt: now,
      });

      await attachReturnVisit(tx, { parent: appointment, service, now, userId: null });

      return { appointment, protocol };
    },
    { behavior: "immediate" }
  );
}

type ManualBookingInput = CreateBookingInput & {
  status: AppointmentStatus;
  internalNote?: string | null;
  userId: string;
};

/** Cadastro manual pelo painel (WhatsApp, Instagram, telefone, presencial). */
export async function createManualAppointment(
  input: ManualBookingInput
): Promise<Appointment> {
  const service = await getServiceById(input.serviceId);
  if (!service) {
    throw new BookingError("service_unavailable");
  }

  const customer = await findOrCreateCustomer({
    name: input.customerName,
    whatsapp: input.customerWhatsapp,
    email: input.customerEmail,
  });

  const startAtUtc = new Date(input.startAtIso);

  return db.transaction(
    async (tx) => {
      const { businessHourRules, blockedPeriods, occupiedRanges } =
        await loadAvailabilityContext(input.dateKey, tx);

      const validation = validateRequestedSlot({
        startAtUtc,
        dateKey: input.dateKey,
        durationMinutes: service.durationMinutes,
        businessHours: businessHourRules,
        blockedPeriods,
        occupiedRanges,
        enforceFuture: false,
        enforceBookingWindow: false,
        slotIntervalMinutes: 1,
      });

      if (!validation.ok) {
        throw new BookingError(validation.reason);
      }

      const now = new Date();
      const id = randomUUID();

      const [appointment] = await tx
        .insert(appointments)
        .values({
          id,
          protocol: generateProtocol(now),
          customerId: customer.id,
          serviceId: service.id,
          serviceNameSnapshot: service.name,
          serviceDurationSnapshot: service.durationMinutes,
          servicePriceSnapshot: service.priceCents,
          startAtUtc,
          endAtUtc: validation.endAtUtc,
          timezone: BUSINESS_TIMEZONE,
          status: input.status,
          paymentStatus: "unpaid",
          origin: input.origin ?? "presencial",
          publicNote: input.publicNote || null,
          internalNote: input.internalNote || null,
          isDemo: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      await tx.insert(appointmentEvents).values({
        id: randomUUID(),
        appointmentId: id,
        fromStatus: null,
        toStatus: appointment.status,
        note: "Cadastrado manualmente no painel.",
        createdByUserId: input.userId,
        createdAt: now,
      });

      await attachReturnVisit(tx, { parent: appointment, service, now, userId: input.userId });

      return appointment;
    },
    { behavior: "immediate" }
  );
}

export async function getAppointmentByProtocol(protocol: string): Promise<Appointment | null> {
  const [row] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.protocol, protocol))
    .limit(1);
  return row ?? null;
}

export async function getAppointmentDetail(id: string) {
  const [row] = await db
    .select({
      appointment: appointments,
      customer: customers,
      serviceColor: services.color,
      serviceImagePath: services.imagePath,
    })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(eq(appointments.id, id))
    .limit(1);

  if (!row) return null;

  const events = await db
    .select()
    .from(appointmentEvents)
    .where(eq(appointmentEvents.appointmentId, id))
    .orderBy(desc(appointmentEvents.createdAt));

  const [{ paidCents }] = await db
    .select({ paidCents: sql<number>`coalesce(sum(${transactions.amountCents}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.appointmentId, id),
        eq(transactions.type, "income"),
        eq(transactions.status, "paid")
      )
    );

  const [returnVisit] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.parentAppointmentId, id))
    .orderBy(desc(appointments.createdAt))
    .limit(1);

  let parentVisit: Appointment | null = null;
  if (row.appointment.parentAppointmentId) {
    const [parent] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, row.appointment.parentAppointmentId))
      .limit(1);
    parentVisit = parent ?? null;
  }

  return { ...row, events, paidCents, returnVisit: returnVisit ?? null, parentVisit };
}

export type AppointmentFilters = {
  dateFrom?: string; // YYYY-MM-DD (zona de negócio)
  dateTo?: string;
  status?: AppointmentStatus[];
  serviceId?: string;
  paymentStatus?: string[];
  origin?: string[];
  search?: string;
  customerId?: string;
};

export async function listAppointments(filters: AppointmentFilters = {}) {
  const conditions = [eq(appointments.isDemo, false)];

  if (filters.dateFrom) {
    const { year, month, day } = parseDateKey(filters.dateFrom);
    conditions.push(
      gte(appointments.startAtUtc, zonedTimeToUtc({ year, month, day, hour: 0, minute: 0 }))
    );
  }
  if (filters.dateTo) {
    const { year, month, day } = parseDateKey(filters.dateTo);
    conditions.push(
      lte(
        appointments.startAtUtc,
        addMinutes(zonedTimeToUtc({ year, month, day, hour: 0, minute: 0 }), 24 * 60 - 1)
      )
    );
  }
  if (filters.serviceId) conditions.push(eq(appointments.serviceId, filters.serviceId));
  if (filters.customerId) conditions.push(eq(appointments.customerId, filters.customerId));
  if (filters.status && filters.status.length > 0) {
    const statusCondition = or(...filters.status.map((s) => eq(appointments.status, s)));
    if (statusCondition) conditions.push(statusCondition);
  }
  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    const searchCondition = or(like(customers.name, term), like(customers.whatsapp, term));
    if (searchCondition) conditions.push(searchCondition);
  }

  const rows = await db
    .select({ appointment: appointments, customer: customers })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(appointments.startAtUtc));

  return rows;
}

export async function updateAppointmentStatus(input: {
  id: string;
  toStatus: AppointmentStatus;
  note?: string;
  userId: string;
}): Promise<Appointment> {
  const [current] = await db.select().from(appointments).where(eq(appointments.id, input.id)).limit(1);
  if (!current) throw new Error("Agendamento não encontrado.");
  if (!canTransitionStatus(current.status, input.toStatus)) {
    throw new Error(`Transição de status inválida: ${current.status} -> ${input.toStatus}`);
  }

  const now = new Date();
  const [updated] = await db
    .update(appointments)
    .set({ status: input.toStatus, updatedAt: now })
    .where(eq(appointments.id, input.id))
    .returning();

  await db.insert(appointmentEvents).values({
    id: randomUUID(),
    appointmentId: input.id,
    fromStatus: current.status,
    toStatus: input.toStatus,
    note: input.note || null,
    createdByUserId: input.userId,
    createdAt: now,
  });

  if (input.toStatus === "canceled" || input.toStatus === "confirmed") {
    const children = await db
      .select()
      .from(appointments)
      .where(eq(appointments.parentAppointmentId, input.id));
    for (const child of children) {
      if (!canTransitionStatus(child.status, input.toStatus)) continue;
      await db
        .update(appointments)
        .set({ status: input.toStatus, updatedAt: now })
        .where(eq(appointments.id, child.id));
      await db.insert(appointmentEvents).values({
        id: randomUUID(),
        appointmentId: child.id,
        fromStatus: child.status,
        toStatus: input.toStatus,
        note:
          input.toStatus === "canceled"
            ? "Cancelado junto com o procedimento."
            : "Confirmado junto com o procedimento.",
        createdByUserId: input.userId,
        createdAt: now,
      });
    }
  }

  return updated;
}

export async function rescheduleAppointment(input: {
  id: string;
  dateKey: string;
  startAtIso: string;
  userId: string;
}): Promise<Appointment> {
  const [current] = await db.select().from(appointments).where(eq(appointments.id, input.id)).limit(1);
  if (!current) throw new Error("Agendamento não encontrado.");

  const startAtUtc = new Date(input.startAtIso);

  return db.transaction(
    async (tx) => {
      const { businessHourRules, blockedPeriods, occupiedRanges } =
        await loadAvailabilityContext(input.dateKey, tx);

      // Exclui o próprio agendamento da checagem de conflito.
      const filteredOccupied = occupiedRanges.filter(
        (range) =>
          !(range.start.getTime() === current.startAtUtc.getTime() &&
            range.end.getTime() === current.endAtUtc.getTime())
      );

      const validation = validateRequestedSlot({
        startAtUtc,
        dateKey: input.dateKey,
        durationMinutes: current.serviceDurationSnapshot,
        businessHours: businessHourRules,
        blockedPeriods,
        occupiedRanges: filteredOccupied,
        enforceBookingWindow: false,
        slotIntervalMinutes: 1,
      });

      if (!validation.ok) {
        throw new BookingError(validation.reason);
      }

      const now = new Date();
      const [updated] = await tx
        .update(appointments)
        .set({
          startAtUtc,
          endAtUtc: validation.endAtUtc,
          returnAdjusted: current.kind === "return" ? true : current.returnAdjusted,
          updatedAt: now,
        })
        .where(eq(appointments.id, input.id))
        .returning();

      await tx.insert(appointmentEvents).values({
        id: randomUUID(),
        appointmentId: input.id,
        fromStatus: current.status,
        toStatus: current.status,
        note: "Agendamento remarcado.",
        createdByUserId: input.userId,
        createdAt: now,
      });

      return updated;
    },
    { behavior: "immediate" }
  );
}

export async function getReturnAppointment(parentId: string): Promise<Appointment | null> {
  const [row] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.parentAppointmentId, parentId))
    .orderBy(desc(appointments.createdAt))
    .limit(1);
  return row ?? null;
}

export async function schedulePendingReturn(input: {
  parentId: string;
  dateKey: string;
  startAtIso: string;
  userId: string;
}): Promise<Appointment> {
  const [parent] = await db.select().from(appointments).where(eq(appointments.id, input.parentId)).limit(1);
  if (!parent || parent.kind === "return") throw new Error("Procedimento não encontrado.");
  if (parent.status === "canceled") throw new Error("O procedimento está cancelado.");

  const existing = await getReturnAppointment(parent.id);
  if (existing && existing.status !== "canceled") {
    throw new Error("Este procedimento já tem retorno marcado.");
  }

  const startAtUtc = new Date(input.startAtIso);

  return db.transaction(
    async (tx) => {
      const { businessHourRules, blockedPeriods, occupiedRanges } = await loadAvailabilityContext(
        input.dateKey,
        tx,
      );
      const validation = validateRequestedSlot({
        startAtUtc,
        dateKey: input.dateKey,
        durationMinutes: parent.serviceDurationSnapshot,
        businessHours: businessHourRules,
        blockedPeriods,
        occupiedRanges,
        enforceBookingWindow: false,
        slotIntervalMinutes: 1,
      });
      if (!validation.ok) throw new BookingError(validation.reason);

      const now = new Date();
      const id = randomUUID();
      const status = parent.status === "completed" || parent.status === "no_show" ? "confirmed" : parent.status;
      const [created] = await tx
        .insert(appointments)
        .values({
          id,
          protocol: generateProtocol(now),
          customerId: parent.customerId,
          serviceId: parent.serviceId,
          serviceNameSnapshot: `Retorno — ${parent.serviceNameSnapshot.replace(/^Retorno — /, "")}`,
          serviceDurationSnapshot: parent.serviceDurationSnapshot,
          servicePriceSnapshot: 0,
          startAtUtc,
          endAtUtc: validation.endAtUtc,
          timezone: BUSINESS_TIMEZONE,
          status,
          paymentStatus: "paid",
          origin: parent.origin,
          internalNote: "Retorno marcado pela Ioná. A cliente precisa ser avisada no WhatsApp.",
          kind: "return",
          parentAppointmentId: parent.id,
          returnAdjusted: parent.returnPlannedAt ? parent.returnPlannedAt.getTime() !== startAtUtc.getTime() : true,
          isDemo: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      await tx.insert(appointmentEvents).values({
        id: randomUUID(),
        appointmentId: id,
        fromStatus: null,
        toStatus: status,
        note: "Retorno marcado manualmente no painel.",
        createdByUserId: input.userId,
        createdAt: now,
      });

      return created;
    },
    { behavior: "immediate" },
  );
}
