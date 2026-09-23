import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getAppointmentDetail } from "@/server/appointments";
import { getAnamnesisStatus } from "@/server/anamnesis";
import {
  updateAppointmentStatusAction,
  rescheduleAppointmentAction,
  schedulePendingReturnAction,
} from "@/app/actions/admin-appointments";
import { registerPaymentAction } from "@/app/actions/admin-finance";
import { formatCentsToBRL } from "@/lib/money";
import { dateKey, formatZonedDate, formatZonedDateTime, formatZonedTime, utcToZonedParts } from "@/lib/timezone";
import { STATUS_TRANSITIONS } from "@/lib/validation/appointment";
import { buildCustomerWhatsappLink } from "@/lib/whatsapp";
import { maskWhatsapp } from "@/lib/masks";
import { MoneyField } from "@/components/admin/MaskedFields";
import { AppointmentStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";
import ErrorBanner from "@/components/admin/ErrorBanner";
import { PAYMENT_METHODS } from "@/db/schema";

export const metadata: Metadata = { title: "Agendamento | Painel Bendita Micro" };

const STATUS_ACTION_LABELS: Record<string, string> = {
  pending: "Voltar para pendente",
  confirmed: "Confirmar",
  completed: "Marcar como concluído",
  canceled: "Cancelar",
  no_show: "Marcar não comparecimento",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  transferencia: "Transferência",
  outro: "Outro",
};

export default async function AppointmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; avisar?: string }>;
}) {
  const { id } = await params;
  const { erro, avisar } = await searchParams;
  const [detail, anamnesisStatus] = await Promise.all([getAppointmentDetail(id), getAnamnesisStatus(id)]);
  if (!detail) notFound();

  const { appointment, customer, events, paidCents, returnVisit, parentVisit } = detail;
  const openReturn = returnVisit && returnVisit.status !== "canceled" ? returnVisit : null;
  const firstName = customer.name.split(" ")[0];
  const whenLabel = `${formatZonedDate(appointment.startAtUtc)} às ${formatZonedTime(appointment.startAtUtc)}`;
  const returnNotice = openReturn
    ? ` O retorno já está reservado para ${formatZonedDate(openReturn.startAtUtc)} às ${formatZonedTime(openReturn.startAtUtc)} (protocolo ${openReturn.protocol}).${
        openReturn.returnAdjusted && appointment.returnPlannedAt
          ? ` O horário previsto era ${formatZonedDate(appointment.returnPlannedAt)} às ${formatZonedTime(appointment.returnPlannedAt)}, mas não estava livre.`
          : ""
      } Se quiser outro dia, é só responder que eu remarco.`
    : appointment.kind === "return"
      ? " Se precisar de outro dia, é só responder que eu remarco."
      : appointment.returnPlannedAt
        ? ` O retorno previsto é ${formatZonedDate(appointment.returnPlannedAt)} às ${formatZonedTime(appointment.returnPlannedAt)}. Vou confirmar o horário com você porque a agenda estava cheia.`
        : "";
  const clientMessage = `Olá, ${firstName}! Aqui é a Ioná, da Bendita Micro. Seu horário de ${appointment.serviceNameSnapshot} está marcado para ${whenLabel}. Protocolo ${appointment.protocol}.${returnNotice}`;
  const plannedParts = appointment.returnPlannedAt ? utcToZonedParts(appointment.returnPlannedAt) : null;
  const returnTo = `/admin/agendamentos/${id}`;
  const remainingCents = Math.max(0, appointment.servicePriceSnapshot - paidCents);
  const idempotencyKey = randomUUID();
  const availableTransitions = STATUS_TRANSITIONS[appointment.status] ?? [];

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <ErrorBanner message={erro} />
      {avisar === "1" && (
        <p className="rounded-2xl border border-wine/30 bg-rose/10 px-4 py-3 text-sm leading-relaxed text-ink">
          Horário atualizado. Avise a cliente no WhatsApp — a mensagem abaixo já vai com a data nova.
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
            Protocolo {appointment.protocol}
          </p>
          <h1 className="text-2xl font-semibold text-ink">{appointment.serviceNameSnapshot}</h1>
          <p className="text-sm text-ink/60">{formatZonedDateTime(appointment.startAtUtc)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <AppointmentStatusBadge status={appointment.status} />
          <PaymentStatusBadge status={appointment.paymentStatus} />
        </div>
      </div>

      {/* Dados públicos */}
      <section className="rounded-2xl border border-surface bg-background p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Dados da cliente</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink/50">Nome</dt>
            <dd className="text-sm text-ink">{customer.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink/50">WhatsApp</dt>
            <dd className="text-sm text-ink">{maskWhatsapp(customer.whatsapp)}</dd>
          </div>
          {customer.email && (
            <div>
              <dt className="text-xs text-ink/50">E-mail</dt>
              <dd className="text-sm text-ink">{customer.email}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-ink/50">Origem</dt>
            <dd className="text-sm text-ink">{appointment.origin}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink/50">Duração</dt>
            <dd className="text-sm text-ink">{appointment.serviceDurationSnapshot} min</dd>
          </div>
          <div>
            <dt className="text-xs text-ink/50">Preço</dt>
            <dd className="text-sm text-ink">{formatCentsToBRL(appointment.servicePriceSnapshot)}</dd>
          </div>
          {appointment.publicNote && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-ink/50">Observação da cliente</dt>
              <dd className="text-sm text-ink">{appointment.publicNote}</dd>
            </div>
          )}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={buildCustomerWhatsappLink(customer.whatsapp, clientMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-wine px-4 py-2 text-sm font-medium text-background hover:bg-ink"
          >
            <MessageCircle className="h-4 w-4" /> Avisar a cliente no WhatsApp
          </a>
          {anamnesisStatus !== "completed" && (
            <Link
              href={`/admin/agendamentos/${appointment.id}/anamnese`}
              className="inline-flex items-center gap-2 rounded-full border border-wine px-4 py-2 text-sm font-medium text-wine hover:bg-wine hover:text-background"
            >
              Iniciar atendimento
            </Link>
          )}
        </div>
      </section>

      {appointment.kind === "return" && parentVisit && (
        <section className="rounded-2xl border border-wine/30 bg-rose/10 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-wine">Retorno</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            Este horário é o retorno de{" "}
            <Link href={`/admin/agendamentos/${parentVisit.id}`} className="font-medium text-wine hover:underline">
              {parentVisit.serviceNameSnapshot}
            </Link>{" "}
            ({formatZonedDateTime(parentVisit.startAtUtc)}). Não gera cobrança. Se remarcar, avise a cliente no
            WhatsApp.
          </p>
          {appointment.returnAdjusted && (
            <p className="mt-2 text-sm text-ink">
              A data foi ajustada porque o horário previsto do procedimento não estava livre, ou a Ioná remarcou.
            </p>
          )}
        </section>
      )}

      {appointment.kind === "procedure" && (openReturn || appointment.returnPlannedAt) && (
        <section className="rounded-2xl border border-wine/30 bg-rose/10 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-wine">Retorno da cliente</h2>
          {openReturn ? (
            <p className="mt-2 text-sm leading-relaxed text-ink">
              Reservado para {formatZonedDateTime(openReturn.startAtUtc)}. Protocolo {openReturn.protocol}.{" "}
              <Link href={`/admin/agendamentos/${openReturn.id}`} className="font-medium text-wine hover:underline">
                Abrir retorno
              </Link>
              . Confirmar ou cancelar este procedimento faz o mesmo no retorno. Remarcar o procedimento não move o
              retorno — abra o retorno e remarque se a data do procedimento mudar.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm leading-relaxed text-ink">
                A data prevista era{" "}
                {appointment.returnPlannedAt ? formatZonedDateTime(appointment.returnPlannedAt) : "—"}. A agenda estava
                cheia e nada foi marcado em cima de outro horário. Escolha um horário livre e avise a cliente.
              </p>
              <form action={schedulePendingReturnAction} className="mt-3 flex flex-wrap items-end gap-3">
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <div className="flex flex-col gap-1">
                  <label htmlFor="returnDateKey" className="text-xs font-medium text-ink/60">
                    Data do retorno
                  </label>
                  <input
                    id="returnDateKey"
                    name="dateKey"
                    type="date"
                    required
                    defaultValue={plannedParts ? dateKey(plannedParts) : undefined}
                    className="rounded-lg border border-surface bg-background px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="returnTime" className="text-xs font-medium text-ink/60">
                    Horário
                  </label>
                  <input
                    id="returnTime"
                    name="time"
                    type="time"
                    required
                    defaultValue={
                      plannedParts
                        ? `${plannedParts.hour.toString().padStart(2, "0")}:${plannedParts.minute.toString().padStart(2, "0")}`
                        : undefined
                    }
                    className="rounded-lg border border-surface bg-background px-2 py-1.5 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-wine px-4 py-2 text-sm font-medium text-background hover:bg-ink"
                >
                  Marcar retorno
                </button>
              </form>
            </>
          )}
          {openReturn?.returnAdjusted && appointment.returnPlannedAt && (
            <p className="mt-2 text-sm text-ink">
              Previsto para {formatZonedDateTime(appointment.returnPlannedAt)}. O horário reservado é outro porque o
              previsto não estava livre.
            </p>
          )}
        </section>
      )}

      {/* Nota interna */}
      <section className="rounded-2xl border border-dashed border-ink/20 bg-surface/20 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">
          Nota interna — uso exclusivo da equipe, nunca exibida à cliente
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink/80">
          {appointment.internalNote || "Nenhuma nota interna registrada."}
        </p>
      </section>

      {/* Ações rápidas de status */}
      <section className="rounded-2xl border border-surface bg-background p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Ações rápidas</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableTransitions.length === 0 && (
            <p className="text-sm text-ink/50">Nenhuma transição de status disponível.</p>
          )}
          {availableTransitions.map((toStatus) => (
            <form key={toStatus} action={updateAppointmentStatusAction}>
              <input type="hidden" name="appointmentId" value={appointment.id} />
              <input type="hidden" name="toStatus" value={toStatus} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <button
                type="submit"
                className="rounded-full border border-surface px-4 py-2 text-sm font-medium text-ink/70 hover:bg-surface"
              >
                {STATUS_ACTION_LABELS[toStatus] ?? toStatus}
              </button>
            </form>
          ))}
        </div>
      </section>

      {/* Pagamento */}
      <section className="rounded-2xl border border-surface bg-background p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Pagamento</h2>
        {appointment.kind === "return" && (
          <p className="mt-2 text-sm text-ink/70">Retorno incluso no procedimento. Sem cobrança extra.</p>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-ink/50">Preço do serviço</p>
            <p className="text-sm font-medium text-ink">{formatCentsToBRL(appointment.servicePriceSnapshot)}</p>
          </div>
          <div>
            <p className="text-xs text-ink/50">Já recebido</p>
            <p className="text-sm font-medium text-ink">{formatCentsToBRL(paidCents)}</p>
          </div>
          <div>
            <p className="text-xs text-ink/50">Restante</p>
            <p className="text-sm font-medium text-ink">{formatCentsToBRL(remainingCents)}</p>
          </div>
        </div>

        {remainingCents > 0 && (
          <form action={registerPaymentAction} className="mt-4 grid gap-3 sm:grid-cols-4">
            <input type="hidden" name="appointmentId" value={appointment.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
            <MoneyField
              id="amountCents"
              name="amountCents"
              label="Valor"
              defaultCents={remainingCents}
              maxCents={remainingCents}
              required
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="paymentMethod" className="text-xs font-medium text-ink/60">
                Forma
              </label>
              <select id="paymentMethod" name="paymentMethod" className="rounded-lg border border-surface px-2 py-1.5 text-sm">
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="financialDate" className="text-xs font-medium text-ink/60">
                Data
              </label>
              <input
                id="financialDate"
                name="financialDate"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="rounded-lg border border-surface px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-full bg-wine px-4 py-2 text-sm font-medium text-background hover:bg-ink"
              >
                Registrar pagamento
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Remarcar */}
      <section className="rounded-2xl border border-surface bg-background p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Remarcar</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          Depois de remarcar, a página pede para avisar a cliente. A mensagem do WhatsApp já sai com a data nova.
          {appointment.kind === "procedure" && openReturn
            ? " Remarcar aqui não muda o retorno."
            : ""}
        </p>
        <form action={rescheduleAppointmentAction} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="appointmentId" value={appointment.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor="dateKey" className="text-xs font-medium text-ink/60">
              Nova data
            </label>
            <input id="dateKey" name="dateKey" type="date" required className="rounded-lg border border-surface px-2 py-1.5 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="time" className="text-xs font-medium text-ink/60">
              Novo horário
            </label>
            <input id="time" name="time" type="time" required className="rounded-lg border border-surface px-2 py-1.5 text-sm" />
          </div>
          <button type="submit" className="rounded-full border border-surface px-4 py-2 text-sm font-medium text-ink/70 hover:bg-surface">
            Remarcar
          </button>
        </form>
      </section>

      {/* Histórico */}
      <section className="rounded-2xl border border-surface bg-background p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Histórico</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id} className="border-l-2 border-surface pl-3 text-sm">
              <p className="text-ink">
                {event.fromStatus ? `${event.fromStatus} → ${event.toStatus}` : `Criado como ${event.toStatus}`}
              </p>
              {event.note && <p className="text-ink/60">{event.note}</p>}
              <p className="text-xs text-ink/40">{formatZonedDateTime(event.createdAt)}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
