"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import type { Service } from "@/db/schema";
import { formatCentsToBRL } from "@/lib/money";
import { formatReturnInterval } from "@/lib/return-visit";
import { dateKey, formatZonedDate, parseDateKey } from "@/lib/timezone";
import type { PublicCalendarDay, PublicSlot } from "@/app/actions/booking";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type SlotOption = PublicSlot;

function shiftMonth(year: number, month: number, delta: number) {
  const next = new Date(year, month - 1 + delta, 1);
  return { year: next.getFullYear(), month: next.getMonth() + 1 };
}

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );
}

function monthOverlapsWindow(year: number, month: number, minDate: string, maxDate: string) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const start = dateKey({ year, month, day: 1 });
  const end = dateKey({ year, month, day: lastDay });
  return start <= maxDate && end >= minDate;
}

function buildMonthCells(year: number, month: number) {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<string | null> = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= lastDay; day += 1) {
    cells.push(dateKey({ year, month, day }));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function BookingDateTimeStep({
  service,
  minDate,
  maxDate,
  dateKeyValue,
  calendarDays,
  isLoadingCalendar,
  slots,
  isLoadingSlots,
  onSelectDate,
  onSelectSlot,
  onBack,
}: {
  service: Service;
  minDate: string;
  maxDate: string;
  dateKeyValue: string;
  calendarDays: PublicCalendarDay[];
  isLoadingCalendar: boolean;
  slots: SlotOption[];
  isLoadingSlots: boolean;
  onSelectDate: (dateKeyValue: string) => void;
  onSelectSlot: (slot: SlotOption) => void;
  onBack: () => void;
}) {
  const start = parseDateKey(minDate);
  const [visible, setVisible] = useState({ year: start.year, month: start.month });

  const dayByKey = useMemo(() => {
    return new Map(calendarDays.map((day) => [day.dateKey, day]));
  }, [calendarDays]);

  const cells = buildMonthCells(visible.year, visible.month);
  const prevMonth = shiftMonth(visible.year, visible.month, -1);
  const nextMonth = shiftMonth(visible.year, visible.month, 1);
  const canGoPrev = monthOverlapsWindow(prevMonth.year, prevMonth.month, minDate, maxDate);
  const canGoNext = monthOverlapsWindow(nextMonth.year, nextMonth.month, minDate, maxDate);

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1 text-sm text-ink/60 hover:text-wine"
      >
        <ChevronLeft className="h-4 w-4" /> Trocar procedimento
      </button>
      <p className="text-sm text-ink/70">
        {service.name} · {service.durationMinutes} min · {formatCentsToBRL(service.priceCents)}
      </p>
      {service.hasReturn && service.returnAmount && service.returnUnit && (
        <p className="rounded-xl bg-rose/10 px-3 py-2 text-sm leading-relaxed text-ink">
          Este procedimento tem retorno em {formatReturnInterval(service.returnAmount, service.returnUnit)}.
          O retorno fica no mesmo horário da data que você escolher. Se estiver ocupado, avisamos o novo
          horário antes de concluir. Dá para remarcar com a Ioná.
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-start">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink">Escolha a data</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => setVisible(prevMonth)}
                className="rounded-full p-1.5 text-ink/70 hover:bg-surface disabled:opacity-30"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="min-w-[9rem] text-center text-sm font-medium capitalize text-ink">
                {monthLabel(visible.year, visible.month)}
              </p>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => setVisible(nextMonth)}
                className="rounded-full p-1.5 text-ink/70 hover:bg-surface disabled:opacity-30"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-ink/40">
            {WEEKDAYS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          {isLoadingCalendar ? (
            <p className="py-8 text-center text-sm text-ink/50">Carregando datas...</p>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, index) => (
                <CalendarDayButton
                  key={cell ?? `empty-${index}`}
                  dateKeyValue={cell}
                  selectedKey={dateKeyValue}
                  day={cell ? dayByKey.get(cell) : undefined}
                  minDate={minDate}
                  maxDate={maxDate}
                  onSelect={onSelectDate}
                />
              ))}
            </div>
          )}

          <ul className="mt-1 flex flex-wrap gap-3 text-xs text-ink/55">
            <li className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-wine" /> Disponível
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-rose bg-rose/20" /> Ocupado
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-ink/15" /> Fechado
            </li>
          </ul>
        </section>

        <div className="h-px bg-surface md:hidden" aria-hidden="true" />
        <div className="hidden w-px self-stretch bg-surface md:block" aria-hidden="true" />

        <section className="flex min-h-[16rem] flex-col gap-3">
          {!dateKeyValue && (
            <p className="rounded-2xl bg-surface/40 px-4 py-8 text-center text-sm text-ink/50">
              Selecione uma data à esquerda para ver os horários.
            </p>
          )}

          {dateKeyValue && (
            <>
              <h2 className="text-sm font-medium text-ink">
                Horários de {formatZonedDate(new Date(`${dateKeyValue}T12:00:00Z`))}
              </h2>
              {isLoadingSlots && <p className="text-sm text-ink/50">Carregando horários...</p>}
              {!isLoadingSlots && slots.length === 0 && (
                <p className="rounded-2xl bg-surface/40 p-4 text-sm text-ink/60">
                  Nenhum horário neste dia. Escolha outra data.
                </p>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map((slot) => {
                  const isOccupied = slot.status === "occupied";
                  return (
                    <button
                      key={slot.startAtIso}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => onSelectSlot(slot)}
                      className={`flex flex-col items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium ${
                        isOccupied
                          ? "cursor-not-allowed border-rose/30 bg-rose/10 text-ink/40 line-through"
                          : "border-surface text-ink hover:border-wine hover:bg-surface/40"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {slot.label}
                      </span>
                      {isOccupied && <span className="text-[10px] font-normal no-underline">Ocupado</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function CalendarDayButton({
  dateKeyValue,
  selectedKey,
  day,
  minDate,
  maxDate,
  onSelect,
}: {
  dateKeyValue: string | null;
  selectedKey: string;
  day?: PublicCalendarDay;
  minDate: string;
  maxDate: string;
  onSelect: (value: string) => void;
}) {
  if (!dateKeyValue) return <span className="h-10" />;

  const dayNumber = Number(dateKeyValue.slice(8));
  const inWindow = dateKeyValue >= minDate && dateKeyValue <= maxDate;
  const isClosed = !day || day.isClosed || !inWindow;
  const hasAvailable = Boolean(day && day.availableCount > 0);
  const hasOccupied = Boolean(day && day.occupiedCount > 0);
  const isSelectable = inWindow && !isClosed && (hasAvailable || hasOccupied);
  const isSelected = selectedKey === dateKeyValue;

  let tone = "text-ink/25";
  if (isSelected) tone = "bg-wine text-background";
  else if (hasAvailable) tone = "text-ink hover:bg-wine/10";
  else if (hasOccupied) tone = "text-rose hover:bg-rose/10";

  return (
    <button
      type="button"
      disabled={!isSelectable}
      onClick={() => onSelect(dateKeyValue)}
      className={`relative h-10 rounded-xl text-sm font-medium ${tone} disabled:cursor-not-allowed`}
    >
      {dayNumber}
      {hasOccupied && !isSelected && (
        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-rose" />
      )}
    </button>
  );
}
