import { Clock, CheckCircle2, CheckCheck, XCircle, UserX, CircleDollarSign, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  canceled: "Cancelado",
  no_show: "Não compareceu",
};

const APPOINTMENT_STATUS_CLASSES: Record<string, string> = {
  pending: "bg-gold/20 text-gold",
  confirmed: "bg-surface text-wine",
  completed: "bg-wine text-background",
  canceled: "bg-ink/10 text-ink/60",
  no_show: "bg-red-100 text-red-700",
};

const APPOINTMENT_STATUS_ICONS: Record<string, LucideIcon> = {
  pending: Clock,
  confirmed: CheckCircle2,
  completed: CheckCheck,
  canceled: XCircle,
  no_show: UserX,
};

export function AppointmentStatusBadge({ status }: { status: string }) {
  const Icon = APPOINTMENT_STATUS_ICONS[status] ?? Clock;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        APPOINTMENT_STATUS_CLASSES[status] ?? "bg-surface text-wine"
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {APPOINTMENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Não pago",
  partially_paid: "Parcial",
  paid: "Pago",
};

const PAYMENT_STATUS_CLASSES: Record<string, string> = {
  unpaid: "bg-ink/10 text-ink/60",
  partially_paid: "bg-gold/20 text-gold",
  paid: "bg-green-100 text-green-700",
};

const PAYMENT_STATUS_ICONS: Record<string, LucideIcon> = {
  unpaid: Wallet,
  partially_paid: CircleDollarSign,
  paid: CheckCircle2,
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const Icon = PAYMENT_STATUS_ICONS[status] ?? Wallet;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        PAYMENT_STATUS_CLASSES[status] ?? "bg-surface text-wine"
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}
