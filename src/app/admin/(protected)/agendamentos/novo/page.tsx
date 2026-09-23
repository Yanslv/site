import type { Metadata } from "next";
import { listActiveServices } from "@/server/services";
import { getCustomerById } from "@/server/customers";
import { createManualAppointmentAction } from "@/app/actions/admin-appointments";
import { APPOINTMENT_STATUSES, APPOINTMENT_ORIGINS } from "@/db/schema";
import ErrorBanner from "@/components/admin/ErrorBanner";
import { WhatsappField } from "@/components/admin/MaskedFields";
import { formatReturnInterval } from "@/lib/return-visit";

export const metadata: Metadata = { title: "Cadastrar cliente já marcada | Painel Bendita Micro" };

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  canceled: "Cancelado",
  no_show: "Não compareceu",
};

const ORIGIN_LABELS: Record<string, string> = {
  site: "Site",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  telefone: "Telefone",
  presencial: "Presencial",
};

export default async function NewManualAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; cliente?: string }>;
}) {
  const { erro, cliente } = await searchParams;
  const [services, existingCustomer] = await Promise.all([
    listActiveServices(),
    cliente ? getCustomerById(cliente) : Promise.resolve(null),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-ink">Cadastrar cliente já marcada</h1>
      <p className="mb-6 text-sm text-ink/60">
        Coloque aqui as clientes que a Ioná já atende: nome, procedimento, data e horário. Esse horário
        some da agenda pública e aparece como ocupado para quem for agendar no site. Se o procedimento tiver
        retorno, a data do retorno entra na agenda no mesmo horário e dá para remarcar.
      </p>
      <ErrorBanner message={erro} />

      <form
        action={createManualAppointmentAction}
        className="flex flex-col gap-5 rounded-2xl border border-surface bg-background p-6 shadow-sm"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="serviceId" className="text-sm font-medium text-ink/80">
            Procedimento
          </label>
          <select
            id="serviceId"
            name="serviceId"
            required
            className="rounded-xl border border-surface px-3 py-2.5 text-sm"
          >
            <option value="">Selecione...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMinutes} min)
                {s.hasReturn && s.returnAmount && s.returnUnit
                  ? ` · retorno em ${formatReturnInterval(s.returnAmount, s.returnUnit)}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dateKey" className="text-sm font-medium text-ink/80">
              Data
            </label>
            <input id="dateKey" name="dateKey" type="date" required className="rounded-xl border border-surface px-3 py-2.5 text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="time" className="text-sm font-medium text-ink/80">
              Horário
            </label>
            <input id="time" name="time" type="time" required className="rounded-xl border border-surface px-3 py-2.5 text-sm" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="customerName" className="text-sm font-medium text-ink/80">
              Nome da cliente
            </label>
            <input
              id="customerName"
              name="customerName"
              required
              defaultValue={existingCustomer?.name ?? ""}
              className="rounded-xl border border-surface px-3 py-2.5 text-sm"
            />
          </div>
          <WhatsappField
            id="customerWhatsapp"
            name="customerWhatsapp"
            label="WhatsApp"
            required
            defaultValue={existingCustomer?.whatsapp ?? ""}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="customerEmail" className="text-sm font-medium text-ink/80">
            E-mail (opcional)
          </label>
          <input id="customerEmail" name="customerEmail" type="email" className="rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="origin" className="text-sm font-medium text-ink/80">
              Origem
            </label>
            <select id="origin" name="origin" defaultValue="presencial" className="rounded-xl border border-surface px-3 py-2.5 text-sm">
              {APPOINTMENT_ORIGINS.map((o) => (
                <option key={o} value={o}>
                  {ORIGIN_LABELS[o]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="status" className="text-sm font-medium text-ink/80">
              Status inicial
            </label>
            <select id="status" name="status" defaultValue="confirmed" className="rounded-xl border border-surface px-3 py-2.5 text-sm">
              {APPOINTMENT_STATUSES.filter((s) => s !== "no_show").map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="internalNote" className="text-sm font-medium text-ink/80">
            Nota interna (nunca aparece para a cliente)
          </label>
          <textarea id="internalNote" name="internalNote" rows={3} className="rounded-xl border border-surface px-3 py-2.5 text-sm" />
        </div>

        <button
          type="submit"
          className="inline-flex w-fit items-center justify-center rounded-full bg-wine px-6 py-2.5 text-sm font-medium text-background hover:bg-ink"
        >
          Cadastrar agendamento
        </button>
      </form>
    </div>
  );
}
