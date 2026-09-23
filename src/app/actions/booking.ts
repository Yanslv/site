"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { publicBookingSchema } from "@/lib/validation/booking";
import { createPublicBooking, BookingError } from "@/server/appointments";
import { checkRateLimit } from "@/lib/rate-limit";
import { getServiceById } from "@/server/services";
import { getBusinessHourRules, getBlockedPeriodsBetween, getOccupiedRangesBetween } from "@/server/schedule";
import {
  getCalendarDaySummary,
  getDaySlots,
  BOOKING_WINDOW_DAYS,
  type SlotStatus,
} from "@/lib/availability";
import {
  parseDateKey,
  zonedTimeToUtc,
  addMinutes,
  addDaysToDateKey,
  todayDateKey,
  formatZonedTime,
  BUSINESS_TIMEZONE,
} from "@/lib/timezone";

const BOOKING_ERROR_MESSAGES: Record<string, string> = {
  outside_business_hours: "Esse horário está fora do funcionamento da clínica.",
  in_the_past: "Esse horário já passou. Escolha outro.",
  conflict: "Esse horário acabou de ser ocupado. Escolha outro horário disponível.",
  outside_booking_window: "Essa data está fora da janela de agendamento (60 dias).",
  invalid_alignment: "Horário inválido. Selecione um horário da lista.",
  service_unavailable: "Este procedimento não está mais disponível.",
};

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

export type PublicSlot = {
  startAtIso: string;
  label: string;
  status: Exclude<SlotStatus, "unavailable">;
};

export type PublicCalendarDay = {
  dateKey: string;
  isClosed: boolean;
  availableCount: number;
  occupiedCount: number;
};

async function loadRangeContext(fromDateKey: string, toDateKey: string) {
  const from = parseDateKey(fromDateKey);
  const to = parseDateKey(toDateKey);
  const rangeStartUtc = zonedTimeToUtc(
    { year: from.year, month: from.month, day: from.day, hour: 0, minute: 0 },
    BUSINESS_TIMEZONE
  );
  const rangeEndUtc = addMinutes(
    zonedTimeToUtc({ year: to.year, month: to.month, day: to.day, hour: 0, minute: 0 }, BUSINESS_TIMEZONE),
    24 * 60
  );

  const [businessHours, blockedPeriods, occupiedRanges] = await Promise.all([
    getBusinessHourRules(),
    getBlockedPeriodsBetween(rangeStartUtc, rangeEndUtc),
    getOccupiedRangesBetween(rangeStartUtc, rangeEndUtc),
  ]);

  return { businessHours, blockedPeriods, occupiedRanges };
}

export async function getBookingCalendarAction(serviceId: string): Promise<PublicCalendarDay[]> {
  const service = await getServiceById(serviceId);
  if (!service || !service.active) return [];

  const minDate = todayDateKey();
  const maxDate = addDaysToDateKey(minDate, BOOKING_WINDOW_DAYS);
  const { businessHours, blockedPeriods, occupiedRanges } = await loadRangeContext(minDate, maxDate);

  const days: PublicCalendarDay[] = [];
  let cursor = minDate;
  while (cursor <= maxDate) {
    days.push(
      getCalendarDaySummary({
        dateKey: cursor,
        durationMinutes: service.durationMinutes,
        businessHours,
        blockedPeriods,
        occupiedRanges,
      })
    );
    cursor = addDaysToDateKey(cursor, 1);
  }
  return days;
}

export async function getDaySlotsAction(
  serviceId: string,
  dateKeyValue: string
): Promise<PublicSlot[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKeyValue)) return [];

  const minDate = todayDateKey();
  const maxDate = addDaysToDateKey(minDate, BOOKING_WINDOW_DAYS);
  if (dateKeyValue < minDate || dateKeyValue > maxDate) return [];

  const service = await getServiceById(serviceId);
  if (!service || !service.active) return [];

  const { businessHours, blockedPeriods, occupiedRanges } = await loadRangeContext(
    dateKeyValue,
    dateKeyValue
  );

  return getDaySlots({
    dateKey: dateKeyValue,
    durationMinutes: service.durationMinutes,
    businessHours,
    blockedPeriods,
    occupiedRanges,
  })
    .filter((slot): slot is typeof slot & { status: PublicSlot["status"] } => slot.status !== "unavailable")
    .map((slot) => ({
      startAtIso: slot.startAtUtc.toISOString(),
      label: formatZonedTime(slot.startAtUtc),
      status: slot.status,
    }));
}

export type CreateBookingActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; protocol: string };

export async function createBookingAction(
  _prevState: CreateBookingActionState,
  formData: FormData
): Promise<CreateBookingActionState> {
  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(`booking:${ip}`, { limit: 5, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: "Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.",
    };
  }

  const parsed = publicBookingSchema.safeParse({
    serviceId: formData.get("serviceId"),
    dateKey: formData.get("dateKey"),
    startAtIso: formData.get("startAtIso"),
    customerName: formData.get("customerName"),
    customerWhatsapp: formData.get("customerWhatsapp"),
    customerEmail: formData.get("customerEmail"),
    publicNote: formData.get("publicNote"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos. Revise o formulário.",
    };
  }

  try {
    const { protocol } = await createPublicBooking({
      serviceId: parsed.data.serviceId,
      dateKey: parsed.data.dateKey,
      startAtIso: parsed.data.startAtIso,
      customerName: parsed.data.customerName,
      customerWhatsapp: parsed.data.customerWhatsapp,
      customerEmail: parsed.data.customerEmail || null,
      publicNote: parsed.data.publicNote || null,
      origin: "site",
    });

    redirect(`/agendar/sucesso?protocolo=${encodeURIComponent(protocol)}`);
  } catch (error) {
    if (error instanceof BookingError) {
      return {
        status: "error",
        message: BOOKING_ERROR_MESSAGES[error.reason] ?? "Não foi possível agendar. Tente novamente.",
      };
    }
    throw error;
  }
}
