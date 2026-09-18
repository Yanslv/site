import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  iconClassName = "bg-surface text-rose",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  iconClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-surface bg-background p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {Icon && (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconClassName}`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
        <p className="text-xs font-medium uppercase tracking-wide text-ink/55">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  );
}
