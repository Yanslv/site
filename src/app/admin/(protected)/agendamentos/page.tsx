import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listAppointments } from "@/server/appointments";
import { listAllServices } from "@/server/services";
import { formatCentsToBRL } from "@/lib/money";
import { formatZonedDateTime } from "@/lib/timezone";
import { APPOINTMENT_STATUSES, type AppointmentStatus } from "@/db/schema";
import { AppointmentStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";
import DemoBadge from "@/components/admin/DemoBadge";

export const metadata: Metadata = { title: "Agendamentos | Painel Bendita Micro" };

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  canceled: "Cancelado",
  no_show: "Não compareceu",
};

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; ate?: string; status?: string; servico?: string; busca?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status ? (params.status.split(",") as AppointmentStatus[]) : undefined;

  const [rows, services] = await Promise.all([
    listAppointments({
      dateFrom: params.de,
      dateTo: params.ate,
      status: statusFilter,
      serviceId: params.servico,
      search: params.busca,
    }),
    listAllServices(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Agendamentos</h1>
        <Link
          href="/admin/agendamentos/novo"
          className="inline-flex items-center gap-2 rounded-full bg-wine px-4 py-2 text-sm font-medium text-background hover:bg-ink"
        >
          <Plus className="h-4 w-4" /> Cadastrar manualmente
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-surface bg-background p-4 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="de" className="text-xs font-medium text-ink/60">
            De
          </label>
          <input id="de" type="date" name="de" defaultValue={params.de} className="rounded-lg border border-surface px-2 py-1.5 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="ate" className="text-xs font-medium text-ink/60">
            Até
          </label>
          <input id="ate" type="date" name="ate" defaultValue={params.ate} className="rounded-lg border border-surface px-2 py-1.5 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="servico" className="text-xs font-medium text-ink/60">
            Procedimento
          </label>
          <select
            id="servico"
            name="servico"
            defaultValue={params.servico ?? ""}
            className="rounded-lg border border-surface px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-ink/60">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded-lg border border-surface px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="busca" className="text-xs font-medium text-ink/60">
            Cliente / telefone
          </label>
          <input
            id="busca"
            type="text"
            name="busca"
            defaultValue={params.busca}
            className="rounded-lg border border-surface px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-background hover:bg-wine"
        >
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-surface bg-background shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-surface text-left text-xs uppercase tracking-wide text-ink/50">
              <th className="px-4 py-3">Quando</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Procedimento</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ appointment, customer }) => (
              <tr key={appointment.id} className="border-b border-surface last:border-0 hover:bg-surface/30">
                <td className="px-4 py-3">
                  <Link href={`/admin/agendamentos/${appointment.id}`} className="font-medium text-wine hover:underline">
                    {formatZonedDateTime(appointment.startAtUtc)}
                  </Link>
                  {appointment.isDemo && (
                    <span className="ml-2 align-middle">
                      <DemoBadge />
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink">{customer.name}</p>
                  <p className="text-xs text-ink/50">{customer.whatsapp}</p>
                </td>
                <td className="px-4 py-3 text-ink/80">{appointment.serviceNameSnapshot}</td>
                <td className="px-4 py-3 text-ink/80">{formatCentsToBRL(appointment.servicePriceSnapshot)}</td>
                <td className="px-4 py-3">
                  <AppointmentStatusBadge status={appointment.status} />
                </td>
                <td className="px-4 py-3">
                  <PaymentStatusBadge status={appointment.paymentStatus} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink/50">
                  Nenhum agendamento encontrado com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
