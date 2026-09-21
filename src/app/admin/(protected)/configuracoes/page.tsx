import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { getBusinessHourRules, listAllBlockedPeriods } from "@/server/schedule";
import { getAutoConfirmAppointments } from "@/lib/settings";
import {
  updateBusinessHoursAction,
  createBlockedPeriodAction,
  deleteBlockedPeriodAction,
  updateAutoConfirmAction,
} from "@/app/actions/admin-settings";
import { formatZonedDateTime } from "@/lib/timezone";
import ErrorBanner from "@/components/admin/ErrorBanner";

export const metadata: Metadata = { title: "Configurações | Painel Bendita Micro" };

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function minutesToTimeString(minutes: number | null): string {
  if (minutes == null) return "";
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const minute = (minutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}`;
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const [rules, blocks, autoConfirm] = await Promise.all([
    getBusinessHourRules(),
    listAllBlockedPeriods(),
    getAutoConfirmAppointments(),
  ]);

  const ruleByWeekday = new Map(rules.map((r) => [r.weekday, r]));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-ink">Configurações</h1>
      <ErrorBanner message={erro} />

      <section className="rounded-2xl border border-surface bg-background p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Horário de funcionamento</h2>
        <p className="mt-1 text-sm text-ink/60">
          Defina o horário de cada dia da semana.
        </p>
        <form action={updateBusinessHoursAction} className="mt-4 flex flex-col gap-3">
          {WEEKDAY_LABELS.map((label, weekday) => {
            const rule = ruleByWeekday.get(weekday);
            return (
              <div
                key={weekday}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-surface px-4 py-3"
              >
                <span className="w-24 text-sm font-medium text-ink">{label}</span>
                <label className="flex items-center gap-2 text-sm text-ink/70">
                  <input
                    type="checkbox"
                    name={`closed-${weekday}`}
                    defaultChecked={rule?.isClosed ?? weekday === 0}
                  />
                  Fechado
                </label>
                <label className="flex items-center gap-2 text-sm text-ink/70">
                  Abre
                  <input
                    type="time"
                    name={`open-${weekday}`}
                    defaultValue={minutesToTimeString(rule?.openMinute ?? null) || "09:00"}
                    className="rounded-lg border border-surface px-2 py-1 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-ink/70">
                  Fecha
                  <input
                    type="time"
                    name={`close-${weekday}`}
                    defaultValue={minutesToTimeString(rule?.closeMinute ?? null) || "18:00"}
                    className="rounded-lg border border-surface px-2 py-1 text-sm"
                  />
                </label>
              </div>
            );
          })}
          <button
            type="submit"
            className="mt-2 inline-flex w-fit items-center justify-center rounded-full bg-wine px-6 py-2.5 text-sm font-medium text-background hover:bg-ink"
          >
            Salvar horários
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-surface bg-background p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Confirmação automática</h2>
        <p className="mt-1 text-sm text-ink/60">
          Quando desligado, a Ioná confirma manualmente cada solicitação.
        </p>
        <form action={updateAutoConfirmAction} className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" name="autoConfirm" defaultChecked={autoConfirm} />
            Confirmar agendamentos automaticamente
          </label>
          <button
            type="submit"
            className="rounded-full border border-surface px-4 py-1.5 text-xs font-medium text-ink/70 hover:bg-surface"
          >
            Salvar
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-surface bg-background p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Bloqueios de agenda</h2>
        <p className="mt-1 text-sm text-ink/60">
          Use para férias, cursos ou qualquer período em que a agenda não deve aceitar novos
          horários.
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {blocks.length === 0 && <li className="text-sm text-ink/50">Nenhum bloqueio cadastrado.</li>}
          {blocks.map((block) => (
            <li
              key={block.id}
              className="flex items-center justify-between rounded-xl border border-surface px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-ink">
                  {formatZonedDateTime(block.startAt)} — {formatZonedDateTime(block.endAt)}
                </p>
                {block.reason && <p className="text-ink/60">{block.reason}</p>}
              </div>
              <form action={deleteBlockedPeriodAction}>
                <input type="hidden" name="id" value={block.id} />
                <button
                  type="submit"
                  aria-label="Remover bloqueio"
                  className="rounded-full p-2 text-ink/50 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>

        <form action={createBlockedPeriodAction} className="mt-5 grid gap-3 sm:grid-cols-4">
          <input
            type="date"
            name="dateKey"
            required
            className="rounded-xl border border-surface px-3 py-2 text-sm sm:col-span-1"
          />
          <input
            type="time"
            name="startTime"
            required
            defaultValue="09:00"
            className="rounded-xl border border-surface px-3 py-2 text-sm"
          />
          <input
            type="time"
            name="endTime"
            required
            defaultValue="18:00"
            className="rounded-xl border border-surface px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="reason"
            placeholder="Motivo (opcional)"
            className="rounded-xl border border-surface px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="inline-flex w-fit items-center justify-center rounded-full bg-wine px-5 py-2 text-sm font-medium text-background hover:bg-ink sm:col-span-4"
          >
            Adicionar bloqueio
          </button>
        </form>
      </section>
    </div>
  );
}
