import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageCircle, Plus } from "lucide-react";
import { listAppointments } from "@/server/appointments";
import { formatCentsToBRL } from "@/lib/money";
import { formatZonedTime, parseDateKey, dateKey, addDaysToDateKey, todayDateKey } from "@/lib/timezone";
import { updateAppointmentStatusAction } from "@/app/actions/admin-appointments";
import { AppointmentStatusBadge } from "@/components/admin/StatusBadge";
import { GuardedSubmitButton } from "@/components/admin/GuardedSubmitButton";
import { buildCustomerWhatsappLink } from "@/lib/whatsapp";
import { maskWhatsapp } from "@/lib/masks";
import { STATUS_TRANSITIONS } from "@/lib/validation/appointment";

export const metadata: Metadata = { title: "Agenda | Painel Bendita Micro" };

const STATUS_ACTION_LABELS: Record<string, string> = {
  confirmed: "Confirmar",
  completed: "Concluir",
  canceled: "Cancelar",
  no_show: "Não veio",
  pending: "Reabrir",
};

const STATUS_ACTION_CLASSES: Record<string, string> = {
  confirmed: "rounded-full bg-wine px-3 py-1.5 text-xs font-medium text-background hover:bg-ink",
  completed: "rounded-full bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800",
  canceled: "rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100",
  no_show: "rounded-full border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100",
  pending: "rounded-full border border-surface px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-surface",
};

const STATUS_CONFIRM: Record<string, string> = {
  canceled: "Cancelar este atendimento?",
  no_show: "Marcar que a cliente não veio?",
};

type ViewMode = "dia" | "semana" | "mes";

function weekStart(dateKeyValue: string): string {
  const { year, month, day } = parseDateKey(dateKeyValue);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return addDaysToDateKey(dateKeyValue, -weekday);
}

function monthRange(dateKeyValue: string): { from: string; to: string } {
  const { year, month } = parseDateKey(dateKeyValue);
  const from = dateKey({ year, month, day: 1 });
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = dateKey({ year, month, day: lastDay });
  return { from, to };
}

export default async function AdminAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string; data?: string }>;
}) {
  const params = await searchParams;
  const view = (params.visao as ViewMode) ?? "dia";
  const dateKeyValue = params.data ?? todayDateKey();

  let dateFrom = dateKeyValue;
  let dateTo = dateKeyValue;
  if (view === "semana") {
    dateFrom = weekStart(dateKeyValue);
    dateTo = addDaysToDateKey(dateFrom, 6);
  } else if (view === "mes") {
    const range = monthRange(dateKeyValue);
    dateFrom = range.from;
    dateTo = range.to;
  }

  const rows = await listAppointments({ dateFrom, dateTo });
  const returnTo = `/admin/agenda?visao=${view}&data=${dateKeyValue}`;

  const stepDays = view === "dia" ? 1 : view === "semana" ? 7 : 30;
  const prevDate = addDaysToDateKey(dateKeyValue, -stepDays);
  const nextDate = addDaysToDateKey(dateKeyValue, stepDays);

  // Agrupa por dia (chave YYYY-MM-DD em horário de negócio) para semana/mês.
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = dateKey(
      (() => {
        const d = row.appointment.startAtUtc;
        return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
      })()
    );
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  const sortedDays = [...grouped.keys()].sort();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Agenda</h1>
        <Link
          href="/admin/agendamentos/novo"
          className="inline-flex items-center gap-2 rounded-full bg-wine px-4 py-2 text-sm font-medium text-background hover:bg-ink"
        >
          <Plus className="h-4 w-4" /> Cadastrar cliente já marcada
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
          {(["dia", "semana", "mes"] as ViewMode[]).map((v) => (
            <Link
              key={v}
              href={`/admin/agenda?visao=${v}&data=${dateKeyValue}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                view === v ? "bg-wine text-background" : "border border-surface text-ink/70 hover:bg-surface"
              }`}
            >
              {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}
            </Link>
          ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/admin/agenda?visao=${view}&data=${prevDate}`}
          className="inline-flex items-center gap-1 rounded-full border border-surface px-3 py-1.5 text-sm text-ink/70 hover:bg-surface"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Link>
        <p className="text-sm font-medium text-ink">
          {view === "dia" ? dateKeyValue : `${dateFrom} — ${dateTo}`}
        </p>
        <Link
          href={`/admin/agenda?visao=${view}&data=${nextDate}`}
          className="inline-flex items-center gap-1 rounded-full border border-surface px-3 py-1.5 text-sm text-ink/70 hover:bg-surface"
        >
          Próximo <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {view === "dia" ? (
        <ol className="flex flex-col gap-3">
          {rows.length === 0 && (
            <li className="rounded-2xl border border-surface bg-background p-6 text-center text-sm text-ink/50">
              Nenhum agendamento neste dia.
            </li>
          )}
          {rows.map(({ appointment, customer }) => {
            const transitions = STATUS_TRANSITIONS[appointment.status] ?? [];
            return (
              <li key={appointment.id} className="rounded-2xl border border-surface bg-background p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {formatZonedTime(appointment.startAtUtc)} · {appointment.serviceNameSnapshot}
                    </p>
                    <p className="text-sm text-ink/70">{customer.name} · {maskWhatsapp(customer.whatsapp)}</p>
                    <p className="text-xs text-ink/50">{formatCentsToBRL(appointment.servicePriceSnapshot)}</p>
                  </div>
                  <AppointmentStatusBadge status={appointment.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/agendamentos/${appointment.id}`}
                    className="rounded-full border border-surface px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-surface"
                  >
                    Ver detalhes
                  </Link>
                  <a
                    href={buildCustomerWhatsappLink(customer.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-[#128C7E] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0E6E63]"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                  {transitions.map((toStatus) => (
                    <form key={toStatus} action={updateAppointmentStatusAction}>
                      <input type="hidden" name="appointmentId" value={appointment.id} />
                      <input type="hidden" name="toStatus" value={toStatus} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <GuardedSubmitButton
                        label={STATUS_ACTION_LABELS[toStatus] ?? toStatus}
                        className={
                          STATUS_ACTION_CLASSES[toStatus] ??
                          "rounded-full border border-surface px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-surface"
                        }
                        confirmMessage={STATUS_CONFIRM[toStatus]}
                      />
                    </form>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedDays.length === 0 && (
            <p className="rounded-2xl border border-surface bg-background p-6 text-center text-sm text-ink/50">
              Nenhum agendamento neste período.
            </p>
          )}
          {sortedDays.map((day) => (
            <Link
              key={day}
              href={`/admin/agenda?visao=dia&data=${day}`}
              className="flex items-center justify-between rounded-2xl border border-surface bg-background p-4 shadow-sm hover:bg-surface/30"
            >
              <span className="text-sm font-medium text-ink">{day}</span>
              <span className="text-sm text-ink/60">{grouped.get(day)!.length} agendamento(s)</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
