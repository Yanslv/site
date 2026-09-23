import type { SiteContent } from "@/lib/site-content";
import { listActiveServices } from "@/server/services";
import SectionHeading from "./SectionHeading";
import ProcedureCard from "./ProcedureCard";

export default async function ProcedureGrid({
  intro,
  contact,
}: {
  intro: SiteContent["proceduresIntro"];
  contact: SiteContent["contact"];
}) {
  const services = await listActiveServices();

  return (
    <section id="procedimentos" className="scroll-mt-24 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading eyebrow="Procedimentos" title={intro.title} description={intro.description} />
        {services.length === 0 ? (
          <p className="mt-10 text-sm text-ink/60">Os procedimentos aparecem aqui depois do cadastro em Serviços.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <ProcedureCard key={service.id} service={service} contact={contact} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
