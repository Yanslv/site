import { randomUUID } from "node:crypto";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardPen, History, MessageCircle } from "lucide-react";
import { registerPaymentAction } from "@/app/actions/admin-finance";
import { AppointmentStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";
import { formatCentsToBRL } from "@/lib/money";
import { addDaysToDateKey, formatZonedTime, parseDateKey, todayDateKey, zonedTimeToUtc } from "@/lib/timezone";
import { buildCustomerWhatsappLink } from "@/lib/whatsapp";

const QUICK_PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
] as const;

type AttendanceItem = {
  appointmentId: string;
  customerId: string;
  customerName: string;
  customerWhatsapp: string;
  serviceName: string;
  kind: string;
  startAtUtc: Date;
  endAtUtc: Date;
  status: string;
  paymentStatus: string;
  priceCents: number;
  paidCents: number;
  remainingCents: number;
  anamnesisStatus: string | null;
};

function dayHeading(dayKey: string): string {
  const { year, month, day } = parseDateKey(dayKey);
  const label = zonedTimeToUtc({ year, month, day, hour: 12, minute: 0 }).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Cuiaba",
  });
  return dayKey === todayDateKey() ? `Hoje, ${label}` : label;
}

function adminHref(monthKey: string, dayKey: string): string {
  return `/admin?mes=${monthKey}&dia=${dayKey}`;
}

export default function DayAttendance({
  monthKey,
  dayKey,
  items,
}: {
  monthKey: string;
  dayKey: string;
  items: AttendanceItem[];
}) {
  const now = Date.now();
  const returnTo = adminHref(monthKey, dayKey);
  const financialDate = todayDateKey();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Atendimentos do dia</h2>
          <p className="text-sm capitalize text-ink/60">{dayHeading(dayKey)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={adminHref(monthKey, addDaysToDateKey(dayKey, -1))}
            className="inline-flex items-center gap-1 rounded-full border border-surface px-3 py-1.5 text-sm text-ink/70 hover:bg-surface"
          >
            <ChevronLeft className="h-4 w-4" /> Dia anterior
          </Link>
          <Link
            href={adminHref(monthKey, todayDateKey())}
            className="rounded-full border border-surface px-3 py-1.5 text-sm text-ink/70 hover:bg-surface"
          >
            Hoje
          </Link>
          <Link
            href={adminHref(monthKey, addDaysToDateKey(dayKey, 1))}
            className="inline-flex items-center gap-1 rounded-full border border-surface px-3 py-1.5 text-sm text-ink/70 hover:bg-surface"
          >
            Próximo dia <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {items.length === 0 && (
        <p className="rounded-2xl border border-surface bg-background p-6 text-center text-sm text-ink/50">
          Nenhum atendimento neste dia.
        </p>
      )}

      <ol className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => {
          const isNow = item.startAtUtc.getTime() <= now && now < item.endAtUtc.getTime();
          return (
            <li
              key={item.appointmentId}
              className={`rounded-2xl border bg-background p-4 shadow-sm ${
                isNow ? "border-wine" : "border-surface"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {formatZonedTime(item.startAtUtc)}–{formatZonedTime(item.endAtUtc)}
                    {isNow ? " · Em atendimento" : ""}
                  </p>
                  <p className="text-base font-semibold text-ink">{item.customerName}</p>
                  <p className="text-sm text-ink/70">{item.serviceName}</p>
                  <p className="text-xs text-ink/50">
                    {formatCentsToBRL(item.priceCents)}
                    {item.remainingCents > 0
                      ? ` · falta ${formatCentsToBRL(item.remainingCents)}`
                      : " · recebido"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <AppointmentStatusBadge status={item.status} />
                  <PaymentStatusBadge status={item.paymentStatus} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {item.anamnesisStatus !== "completed" && (
                  <Link
                    href={`/admin/agendamentos/${item.appointmentId}/anamnese`}
                    className="inline-flex items-center gap-1 rounded-full bg-wine px-3 py-1.5 text-xs font-medium text-background hover:bg-ink"
                  >
                    <ClipboardPen className="h-3.5 w-3.5" /> Iniciar atendimento
                  </Link>
                )}
                {item.anamnesisStatus === "draft" && (
                  <span className="inline-flex items-center rounded-full bg-surface px-3 py-1.5 text-xs text-ink/70">
                    Rascunho salvo
                  </span>
                )}
                {item.anamnesisStatus === "completed" && (
                  <span className="inline-flex items-center rounded-full bg-surface px-3 py-1.5 text-xs text-ink/70">
                    Anamnese concluída
                  </span>
                )}
                <a
                  href={buildCustomerWhatsappLink(
                    item.customerWhatsapp,
                    `Olá, ${item.customerName.split(" ")[0]}! Aqui é da Bendita Micro, sobre seu horário das ${formatZonedTime(item.startAtUtc)}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-[#128C7E] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0E6E63]"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
                <Link
                  href={`/admin/clientes/${item.customerId}`}
                  className="inline-flex items-center gap-1 rounded-full border border-surface px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-surface"
                >
                  <History className="h-3.5 w-3.5" /> Ver histórico
                </Link>
              </div>

              {item.kind === "return" ? (
                <p className="mt-3 text-xs font-medium text-wine">Retorno incluso no procedimento. Sem cobrança extra.</p>
              ) : item.remainingCents > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-ink/50">
                    Receber {formatCentsToBRL(item.remainingCents)}
                  </span>
                  {QUICK_PAYMENT_METHODS.map((method) => (
                    <form key={method.value} action={registerPaymentAction}>
                      <input type="hidden" name="appointmentId" value={item.appointmentId} />
                      <input type="hidden" name="amountCents" value={item.remainingCents} />
                      <input type="hidden" name="paymentMethod" value={method.value} />
                      <input type="hidden" name="financialDate" value={financialDate} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="idempotencyKey" value={randomUUID()} />
                      <button
                        type="submit"
                        className="rounded-full bg-wine px-3 py-1.5 text-xs font-medium text-background hover:bg-ink"
                      >
                        {method.label}
                      </button>
                    </form>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs font-medium text-green-700">Pagamento recebido</p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
