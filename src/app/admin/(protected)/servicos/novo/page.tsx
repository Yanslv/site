import type { Metadata } from "next";
import { createServiceAction } from "@/app/actions/admin-services";
import ServiceForm from "@/components/admin/ServiceForm";
import ErrorBanner from "@/components/admin/ErrorBanner";

export const metadata: Metadata = { title: "Novo serviço | Painel Bendita Micro" };

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-ink">Novo serviço</h1>
      <ErrorBanner message={erro} />
      <div className="rounded-2xl border border-surface bg-background p-6 shadow-sm">
        <ServiceForm action={createServiceAction} />
      </div>
    </div>
  );
}
