import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Tag } from "lucide-react";
import { listAllServices } from "@/server/services";
import { toggleServiceActiveAction } from "@/app/actions/admin-services";
import { formatCentsToBRL } from "@/lib/money";
import ErrorBanner from "@/components/admin/ErrorBanner";

export const metadata: Metadata = { title: "Serviços | Painel Bendita Micro" };

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const services = await listAllServices();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Serviços</h1>
        <Link
          href="/admin/servicos/novo"
          className="inline-flex items-center gap-2 rounded-full bg-wine px-4 py-2 text-sm font-medium text-background hover:bg-ink"
        >
          <Plus className="h-4 w-4" /> Novo serviço
        </Link>
      </div>

      <ErrorBanner message={erro} />

      <div className="overflow-x-auto rounded-2xl border border-surface bg-background shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-surface text-left text-xs uppercase tracking-wide text-ink/50">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Duração</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-b border-surface last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Tag
                      className="h-4 w-4 shrink-0"
                      style={{ color: service.color }}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-ink">{service.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink/70">{service.durationMinutes} min</td>
                <td className="px-4 py-3 text-ink/70">{formatCentsToBRL(service.priceCents)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      service.active ? "bg-green-100 text-green-700" : "bg-ink/10 text-ink/60"
                    }`}
                  >
                    {service.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/servicos/${service.id}/editar`}
                      className="rounded-full border border-surface px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-surface"
                    >
                      Editar
                    </Link>
                    <form action={toggleServiceActiveAction}>
                      <input type="hidden" name="id" value={service.id} />
                      <input type="hidden" name="active" value={(!service.active).toString()} />
                      <button
                        type="submit"
                        className="rounded-full border border-surface px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-surface"
                      >
                        {service.active ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
