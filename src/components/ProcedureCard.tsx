import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { Service } from "@/db/schema";
import { formatCentsToBRL } from "@/lib/money";
import { formatReturnInterval } from "@/lib/return-visit";
import { whatsappHref } from "@/lib/whatsapp";
import type { SiteContent } from "@/lib/site-content";
import WhatsappCta from "./WhatsappCta";

export default function ProcedureCard({
  service,
  contact,
}: {
  service: Service;
  contact: SiteContent["contact"];
}) {
  const whatsappMessage = `Olá! Gostaria de saber mais sobre ${service.name} e como funciona a avaliação.`;
  const href = whatsappHref({
    number: contact.whatsappNumber,
    publicLink: contact.whatsappPublicLink,
    message: whatsappMessage,
  });

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-surface bg-background shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full">
        {service.imagePath ? (
          <Image
            src={service.imagePath}
            alt={`Referência visual — ${service.name}`}
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full" style={{ backgroundColor: service.color }} aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-semibold text-ink">{service.name}</h3>
        {service.description && (
          <p className="flex-1 text-sm leading-relaxed text-ink/70">{service.description}</p>
        )}
        {service.hasReturn && service.returnAmount && service.returnUnit && (
          <p className="text-sm text-wine">
            Inclui retorno em {formatReturnInterval(service.returnAmount, service.returnUnit)}. A data fica
            reservada quando você agenda.
          </p>
        )}
        <div className="flex items-center justify-between text-sm text-ink/70">
          <span>{service.durationMinutes} min</span>
          <span className="text-base font-semibold text-wine">{formatCentsToBRL(service.priceCents)}</span>
        </div>
        <div className="mt-1 flex flex-col gap-2">
          <Link
            href={`/agendar?servico=${service.id}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-wine px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-ink"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Agendar
          </Link>
          <WhatsappCta
            label="Tirar dúvidas"
            variant="outline"
            size="md"
            className="w-full"
            href={href}
          />
        </div>
      </div>
    </article>
  );
}
