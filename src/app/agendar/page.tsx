import type { Metadata } from "next";
import Link from "next/link";
import { listActiveServices } from "@/server/services";
import { demoNotice } from "@/config/site";
import BookingWizard from "./BookingWizard";

export const metadata: Metadata = {
  title: "Agendar | Bendita Micro",
  description: "Solicite um horário com a Bendita Micro em poucos passos.",
};

export default async function AgendarPage({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string }>;
}) {
  const { servico } = await searchParams;
  const services = await listActiveServices();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-ink text-background">
        <p className="mx-auto max-w-3xl px-4 py-2 text-center text-xs sm:text-sm">{demoNotice}</p>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Link href="/" className="text-sm text-wine hover:underline">
          ← Voltar para o site
        </Link>
        <h1 className="mt-3 font-serif-display text-3xl font-semibold text-ink sm:text-4xl">
          Agendar com a Bendita Micro
        </h1>
        <p className="mt-2 text-sm text-ink/70 sm:text-base">
          Escolha o procedimento, a data e o horário. A Ioná confirma sua solicitação pelo WhatsApp.
        </p>
        <div className="mt-8">
          <BookingWizard services={services} initialServiceId={servico} />
        </div>
      </div>
    </div>
  );
}
