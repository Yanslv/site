"use client";

import { useEffect, useMemo, useRef, useState, useActionState } from "react";
import { Check, ChevronLeft, Sparkles, CalendarDays, User, ClipboardCheck } from "lucide-react";
import type { Service } from "@/db/schema";
import { formatCentsToBRL } from "@/lib/money";
import { todayDateKey, addDaysToDateKey, formatZonedDate } from "@/lib/timezone";
import { formatReturnInterval, plannedReturnInstant, returnPreviewMessage } from "@/lib/return-visit";
import {
  getBookingCalendarAction,
  getDaySlotsAction,
  createBookingAction,
  type CreateBookingActionState,
  type PublicCalendarDay,
  type PublicSlot,
} from "@/app/actions/booking";
import { BOOKING_WINDOW_DAYS } from "@/lib/availability";
import { maskWhatsapp } from "@/lib/masks";
import BookingDateTimeStep from "./BookingDateTimeStep";

type Step = "service" | "when" | "info" | "review";

const initialActionState: CreateBookingActionState = { status: "idle" };

const STEPS: { key: Step; label: string; icon: typeof Sparkles }[] = [
  { key: "service", label: "Procedimento", icon: Sparkles },
  { key: "when", label: "Data e horário", icon: CalendarDays },
  { key: "info", label: "Seus dados", icon: User },
  { key: "review", label: "Revisão", icon: ClipboardCheck },
];

export default function BookingWizard({
  services,
  initialServiceId,
}: {
  services: Service[];
  initialServiceId?: string;
}) {
  const initialValidServiceId =
    initialServiceId && services.some((s) => s.id === initialServiceId) ? initialServiceId : null;
  const [step, setStep] = useState<Step>(initialValidServiceId ? "when" : "service");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(initialValidServiceId);
  const [dateKeyValue, setDateKeyValue] = useState("");
  const [calendarDays, setCalendarDays] = useState<PublicCalendarDay[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [publicNote, setPublicNote] = useState("");

  const [state, formAction, isPending] = useActionState<CreateBookingActionState, FormData>(
    createBookingAction,
    initialActionState
  );

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  );

  const minDate = todayDateKey();
  const maxDate = addDaysToDateKey(minDate, BOOKING_WINDOW_DAYS);
  const latestRequestKey = useRef<string | null>(null);

  useEffect(() => {
    if (step !== "when" || !selectedServiceId) return;
    let cancelled = false;
    setIsLoadingCalendar(true);
    getBookingCalendarAction(selectedServiceId).then((days) => {
      if (cancelled) return;
      setCalendarDays(days);
      setIsLoadingCalendar(false);
    });
    return () => {
      cancelled = true;
    };
  }, [step, selectedServiceId]);

  function loadSlotsFor(serviceId: string, requestedDateKey: string) {
    const requestKey = `${serviceId}:${requestedDateKey}`;
    latestRequestKey.current = requestKey;
    setSelectedSlot(null);
    setSlots([]);
    setIsLoadingSlots(true);
    getDaySlotsAction(serviceId, requestedDateKey)
      .then((result) => {
        if (latestRequestKey.current !== requestKey) return;
        setSlots(result);
      })
      .finally(() => {
        if (latestRequestKey.current === requestKey) setIsLoadingSlots(false);
      });
  }

  function goTo(nextStep: Step) {
    setStep(nextStep);
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap gap-2 text-xs font-medium text-ink/50">
        {STEPS.map(({ key, label, icon: StepIcon }, i) => {
          const currentIndex = STEPS.findIndex((s) => s.key === step);
          const isCompleted = i < currentIndex;
          const isCurrent = key === step;
          const Icon = isCompleted ? Check : StepIcon;
          return (
            <li
              key={key}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
                isCurrent ? "bg-wine text-background" : isCompleted ? "bg-rose/15 text-rose" : "bg-surface/60"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </li>
          );
        })}
      </ol>

      {step === "service" && (
        <div className="flex flex-col gap-3">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => {
                setSelectedServiceId(service.id);
                setDateKeyValue("");
                setSlots([]);
                setSelectedSlot(null);
                setCalendarDays([]);
                goTo("when");
              }}
              className="flex items-center justify-between gap-3 rounded-2xl border border-surface bg-background p-4 text-left shadow-sm transition-colors hover:border-wine"
            >
              <div>
                <p className="font-medium text-ink">{service.name}</p>
                <p className="text-sm text-ink/60">
                  {service.durationMinutes} min
                  {service.hasReturn && service.returnAmount && service.returnUnit
                    ? ` · retorno em ${formatReturnInterval(service.returnAmount, service.returnUnit)}`
                    : ""}
                </p>
              </div>
              <span className="font-semibold text-wine">{formatCentsToBRL(service.priceCents)}</span>
            </button>
          ))}
        </div>
      )}

      {step === "when" && selectedService && (
        <BookingDateTimeStep
          service={selectedService}
          minDate={minDate}
          maxDate={maxDate}
          dateKeyValue={dateKeyValue}
          calendarDays={calendarDays}
          isLoadingCalendar={isLoadingCalendar}
          slots={slots}
          isLoadingSlots={isLoadingSlots}
          onSelectDate={(value) => {
            setDateKeyValue(value);
            loadSlotsFor(selectedService.id, value);
          }}
          onSelectSlot={(slot) => {
            setSelectedSlot(slot);
            goTo("info");
          }}
          onBack={() => goTo("service")}
        />
      )}

      {step === "info" && selectedService && selectedSlot && (
        <div className="flex flex-col gap-4">
          <button type="button" onClick={() => goTo("when")} className="inline-flex w-fit items-center gap-1 text-sm text-ink/60 hover:text-wine">
            <ChevronLeft className="h-4 w-4" /> Trocar data ou horário
          </button>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="customerName" className="text-sm font-medium text-ink/80">
              Nome completo
            </label>
            <input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="rounded-xl border border-surface px-3 py-2.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="customerWhatsapp" className="text-sm font-medium text-ink/80">
              WhatsApp (com DDD)
            </label>
            <input
              id="customerWhatsapp"
              inputMode="tel"
              autoComplete="tel"
              value={customerWhatsapp}
              onChange={(e) => setCustomerWhatsapp(maskWhatsapp(e.target.value))}
              placeholder="(65) 90000-0000"
              required
              className="rounded-xl border border-surface px-3 py-2.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="customerEmail" className="text-sm font-medium text-ink/80">
              E-mail (opcional)
            </label>
            <input
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="rounded-xl border border-surface px-3 py-2.5 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="publicNote" className="text-sm font-medium text-ink/80">
              Alguma observação? (opcional)
            </label>
            <textarea
              id="publicNote"
              value={publicNote}
              onChange={(e) => setPublicNote(e.target.value)}
              rows={3}
              className="rounded-xl border border-surface px-3 py-2.5 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={!customerName.trim() || !customerWhatsapp.trim()}
            onClick={() => goTo("review")}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-wine px-5 py-2.5 text-sm font-medium text-background hover:bg-ink disabled:opacity-50"
          >
            Revisar solicitação
          </button>
        </div>
      )}

      {step === "review" && selectedService && selectedSlot && (
        <form action={formAction} className="flex flex-col gap-4">
          <button type="button" onClick={() => goTo("info")} className="inline-flex w-fit items-center gap-1 text-sm text-ink/60 hover:text-wine">
            <ChevronLeft className="h-4 w-4" /> Editar dados
          </button>

          <input type="hidden" name="serviceId" value={selectedService.id} />
          <input type="hidden" name="dateKey" value={dateKeyValue} />
          <input type="hidden" name="startAtIso" value={selectedSlot.startAtIso} />
          <input type="hidden" name="customerName" value={customerName} />
          <input type="hidden" name="customerWhatsapp" value={customerWhatsapp} />
          <input type="hidden" name="customerEmail" value={customerEmail} />
          <input type="hidden" name="publicNote" value={publicNote} />

          <div className="rounded-2xl border border-surface bg-surface/30 p-5">
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/60">Procedimento</dt>
                <dd className="font-medium text-ink">{selectedService.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/60">Data</dt>
                <dd className="font-medium text-ink">{formatZonedDate(new Date(`${dateKeyValue}T12:00:00Z`))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/60">Horário</dt>
                <dd className="font-medium text-ink">{selectedSlot.label} (America/Cuiaba)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/60">Preço</dt>
                <dd className="font-medium text-ink">{formatCentsToBRL(selectedService.priceCents)}</dd>
              </div>
              {selectedService.hasReturn && selectedService.returnAmount && selectedService.returnUnit && (
                <div className="rounded-xl bg-rose/10 px-3 py-2 text-sm leading-relaxed text-ink">
                  {returnPreviewMessage(
                    formatReturnInterval(selectedService.returnAmount, selectedService.returnUnit),
                    plannedReturnInstant(
                      new Date(selectedSlot.startAtIso),
                      selectedService.returnAmount,
                      selectedService.returnUnit,
                    ),
                  )}
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink/60">Cliente</dt>
                <dd className="font-medium text-ink">{customerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/60">WhatsApp</dt>
                <dd className="font-medium text-ink">{customerWhatsapp}</dd>
              </div>
            </dl>
          </div>

          {state.status === "error" && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>
          )}

          <p className="text-xs text-ink/50">A Ioná confirma seu horário pelo WhatsApp.</p>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-wine px-6 py-3 text-sm font-medium text-background hover:bg-ink disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {isPending ? "Enviando..." : "Solicitar agendamento"}
          </button>
        </form>
      )}
    </div>
  );
}
