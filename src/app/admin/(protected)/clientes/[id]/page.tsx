import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { getCustomerById } from "@/server/customers";
import { listAppointments } from "@/server/appointments";
import { formatCentsToBRL } from "@/lib/money";
import { formatZonedDateTime, formatZonedDate } from "@/lib/timezone";
import { buildCustomerWhatsappLink } from "@/lib/whatsapp";
import { AppointmentStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";
import DemoBadge from "@/components/admin/DemoBadge";

export const metadata: Metadata = { title: "Cliente | Painel Bendita Micro" };

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  const history = await listAppointments({ customerId: id });

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Cliente</p>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
          {customer.name} {customer.isDemo && <DemoBadge />}
        </h1>
        <p className="text-sm text-ink/60">
          Cliente desde {formatZonedDate(customer.createdAt)}
        </p>
      </div>

      <section className="rounded-2xl border border-surface bg-background p-6 shadow-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink/50">WhatsApp</dt>
            <dd className="text-sm text-ink">{customer.whatsapp}</dd>
          </div>
          {customer.email && (
            <div>
              <dt className="text-xs text-ink/50">E-mail</dt>
              <dd className="text-sm text-ink">{customer.email}</dd>
            </div>
          )}
        </dl>
        {customer.notes && (
          <p className="mt-3 rounded-xl bg-surface/40 p-3 text-sm text-ink/70">{customer.notes}</p>
        )}
        <a
          href={buildCustomerWhatsappLink(customer.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-wine px-4 py-2 text-sm font-medium text-background hover:bg-ink"
        >
          <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
        </a>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/50">
          Histórico de agendamentos
        </h2>
        <div className="flex flex-col gap-2">
          {history.length === 0 && (
            <p className="rounded-2xl border border-surface bg-background p-4 text-sm text-ink/50">
              Nenhum agendamento registrado ainda.
            </p>
          )}
          {history.map(({ appointment }) => (
            <Link
              key={appointment.id}
              href={`/admin/agendamentos/${appointment.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-surface bg-background p-4 shadow-sm hover:bg-surface/30"
            >
              <div>
                <p className="text-sm font-medium text-ink">{appointment.serviceNameSnapshot}</p>
                <p className="text-xs text-ink/50">{formatZonedDateTime(appointment.startAtUtc)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink/70">{formatCentsToBRL(appointment.servicePriceSnapshot)}</span>
                <AppointmentStatusBadge status={appointment.status} />
                <PaymentStatusBadge status={appointment.paymentStatus} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
