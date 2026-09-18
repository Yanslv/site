import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceById } from "@/server/services";
import { updateServiceAction } from "@/app/actions/admin-services";
import ServiceForm from "@/components/admin/ServiceForm";
import ErrorBanner from "@/components/admin/ErrorBanner";

export const metadata: Metadata = { title: "Editar serviço | Painel Bendita Micro" };

export default async function EditServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;
  const service = await getServiceById(id);
  if (!service) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-ink">Editar serviço</h1>
      <ErrorBanner message={erro} />
      <div className="rounded-2xl border border-surface bg-background p-6 shadow-sm">
        <ServiceForm action={updateServiceAction} service={service} />
      </div>
    </div>
  );
}
