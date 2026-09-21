import { listActiveServices } from "@/server/services";
import SectionHeading from "./SectionHeading";
import ProcedureCard from "./ProcedureCard";

export default async function ProcedureGrid() {
  const services = await listActiveServices();

  return (
    <section id="procedimentos" className="scroll-mt-24 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Procedimentos"
          title="Serviços da Bendita Micro"
          description="Conheça as especialidades da Ioná, veja preço e duração e tire suas dúvidas antes de escolher o procedimento ideal para você."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <ProcedureCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
