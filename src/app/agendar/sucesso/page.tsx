import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, MessageCircle } from "lucide-react";
import { getAppointmentByProtocol, getReturnAppointment } from "@/server/appointments";
import { formatCentsToBRL } from "@/lib/money";
import { formatZonedDate, formatZonedTime } from "@/lib/timezone";
import { getSiteContent } from "@/server/site-content";
import { whatsappHref } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Agendamento solicitado | Bendita Micro",
  robots: { index: false, follow: false },
};

export default async function AgendarSucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ protocolo?: string }>;
}) {
  const { protocolo } = await searchParams;
  const appointment = protocolo ? await getAppointmentByProtocol(protocolo) : null;

  if (!appointment) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink">Protocolo não encontrado</h1>
        <p className="mt-2 text-sm text-ink/60">
          Não localizamos essa solicitação. Verifique o link ou faça um novo agendamento.
        </p>
        <Link href="/agendar" className="mt-6 inline-block rounded-full bg-wine px-6 py-3 text-sm font-medium text-background hover:bg-ink">
          Agendar novamente
        </Link>
      </div>
    );
  }

  const site = await getSiteContent();
  const returnVisit = await getReturnAppointment(appointment.id);
  const openReturn = returnVisit && returnVisit.status !== "canceled" ? returnVisit : null;
  const returnLine = openReturn
    ? ` Retorno já reservado: ${formatZonedDate(openReturn.startAtUtc)} às ${formatZonedTime(openReturn.startAtUtc)}. Protocolo do retorno: ${openReturn.protocol}.${
        openReturn.returnAdjusted && appointment.returnPlannedAt
          ? ` O horário previsto era ${formatZonedDate(appointment.returnPlannedAt)} às ${formatZonedTime(appointment.returnPlannedAt)}, mas não estava livre.`
          : ""
      } Se precisar remarcar o retorno, me avise.`
    : appointment.returnPlannedAt
      ? ` Este procedimento tem retorno previsto para ${formatZonedDate(appointment.returnPlannedAt)} às ${formatZonedTime(appointment.returnPlannedAt)}. A agenda estava cheia e a Ioná vai confirmar o horário do retorno.`
      : "";
  const whatsappMessage = `Olá! Acabei de solicitar um agendamento na Bendita Micro. Procedimento: ${appointment.serviceNameSnapshot}. Data: ${formatZonedDate(
    appointment.startAtUtc
  )}. Horário: ${formatZonedTime(appointment.startAtUtc)}. Protocolo: ${appointment.protocol}.${returnLine}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-12 text-center sm:py-16">
        <CheckCircle2 className="mx-auto h-12 w-12 text-wine" aria-hidden="true" />
        <h1 className="mt-4 font-serif-display text-3xl font-semibold text-ink">
          Solicitação enviada!
        </h1>
        <p className="mt-2 text-sm text-ink/70 sm:text-base">
          Protocolo <strong>{appointment.protocol}</strong>. Seu horário ainda aguarda confirmação
          da Ioná — fale pelo WhatsApp para agilizar.
        </p>

        <div className="mt-8 rounded-2xl border border-surface bg-surface/30 p-6 text-left">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/60">Procedimento</dt>
              <dd className="font-medium text-ink">{appointment.serviceNameSnapshot}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/60">Preço</dt>
              <dd className="font-medium text-ink">{formatCentsToBRL(appointment.servicePriceSnapshot)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/60">Duração</dt>
              <dd className="font-medium text-ink">{appointment.serviceDurationSnapshot} min</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/60">Data</dt>
              <dd className="font-medium text-ink">{formatZonedDate(appointment.startAtUtc)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink/60">Horário</dt>
              <dd className="flex items-center gap-1 font-medium text-ink">
                <Clock className="h-3.5 w-3.5 text-rose" /> {formatZonedTime(appointment.startAtUtc)} (America/Cuiaba)
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/60">Status</dt>
              <dd className="font-medium text-ink">Aguardando confirmação</dd>
            </div>
          </dl>
        </div>

        {openReturn && (
          <div className="mt-4 rounded-2xl border border-wine/30 bg-rose/10 p-6 text-left">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-wine">Retorno já reservado</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              {formatZonedDate(openReturn.startAtUtc)} às {formatZonedTime(openReturn.startAtUtc)}. Protocolo{" "}
              <strong>{openReturn.protocol}</strong>. Esse horário já está na agenda da Ioná.
            </p>
            {openReturn.returnAdjusted && appointment.returnPlannedAt && (
              <p className="mt-2 text-sm leading-relaxed text-ink">
                O horário previsto era {formatZonedDate(appointment.returnPlannedAt)} às{" "}
                {formatZonedTime(appointment.returnPlannedAt)}, no mesmo horário do procedimento. Ele não estava
                livre, então reservamos o próximo disponível.
              </p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-ink">
              Dá para remarcar. Fale com a Ioná pelo WhatsApp e diga o protocolo do retorno.
            </p>
          </div>
        )}

        {!openReturn && appointment.returnPlannedAt && (
          <div className="mt-4 rounded-2xl border border-wine/30 bg-rose/10 p-6 text-left">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-wine">Retorno previsto</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              A data prevista é {formatZonedDate(appointment.returnPlannedAt)} às{" "}
              {formatZonedTime(appointment.returnPlannedAt)}. A agenda estava cheia nesse período, então a Ioná
              confirma o horário do retorno pelo WhatsApp. Nada ficou marcado em cima de outro atendimento.
            </p>
          </div>
        )}

        <a
          href={whatsappHref({
            number: site.contact.whatsappNumber,
            publicLink: site.contact.whatsappPublicLink,
            message: whatsappMessage,
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-wine px-6 py-3 text-sm font-medium text-background hover:bg-ink"
        >
          <MessageCircle className="h-4 w-4" /> Confirmar pelo WhatsApp
        </a>

        <p className="mt-6">
          <Link href="/" className="text-sm text-wine hover:underline">
            Voltar para o site
          </Link>
        </p>
      </div>
    </div>
  );
}
