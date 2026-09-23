import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnamnesisForm } from "@/components/admin/anamnesis/AnamnesisForm";
import { formatZonedDateTime } from "@/lib/timezone";
import { getAnamnesisScreen } from "@/server/anamnesis";

export const metadata: Metadata = { title: "Anamnese | Painel Bendita Micro" };

export default async function AnamnesisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const screen = await getAnamnesisScreen(id);
  if (!screen) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Link href="/admin" className="text-sm font-medium text-wine">
        Voltar aos atendimentos do dia
      </Link>
      <AnamnesisForm
        appointmentId={screen.appointment.id}
        serviceName={screen.appointment.serviceNameSnapshot}
        whenLabel={formatZonedDateTime(screen.appointment.startAtUtc)}
        initialPayload={screen.payload}
        initialStatus={screen.status}
      />
    </div>
  );
}
