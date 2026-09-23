import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { listCustomers } from "@/server/customers";
import { formatZonedDate } from "@/lib/timezone";
import { maskWhatsapp } from "@/lib/masks";

export const metadata: Metadata = { title: "Clientes | Painel Bendita Micro" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const { busca } = await searchParams;
  const customers = await listCustomers(busca);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Clientes</h1>
        <Link
          href="/admin/agendamentos/novo"
          className="inline-flex items-center gap-2 rounded-full bg-wine px-4 py-2 text-sm font-medium text-background hover:bg-ink"
        >
          <Plus className="h-4 w-4" /> Cadastrar cliente já marcada
        </Link>
      </div>

      <form method="get" className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            name="busca"
            defaultValue={busca}
            placeholder="Buscar por nome ou telefone"
            className="w-full rounded-full border border-surface py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-background hover:bg-wine">
          Buscar
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-surface bg-background shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-surface text-left text-xs uppercase tracking-wide text-ink/50">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Cliente desde</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const href = `/admin/clientes/${customer.id}`;
              return (
                <tr key={customer.id} className="border-b border-surface last:border-0 hover:bg-surface/30">
                  <td className="p-0">
                    <Link href={href} className="block px-4 py-3 font-medium text-ink">
                      {customer.name}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={href} tabIndex={-1} className="block px-4 py-3 text-ink/70">
                      {maskWhatsapp(customer.whatsapp)}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={href} tabIndex={-1} className="block px-4 py-3 text-ink/70">
                      {formatZonedDate(customer.createdAt)}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-ink/50">
                  Nenhuma cliente encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
