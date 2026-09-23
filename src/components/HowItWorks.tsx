import { MessageCircle, Search, ClipboardList, CalendarCheck } from "lucide-react";
import type { SiteContent } from "@/lib/site-content";
import SectionHeading from "./SectionHeading";

const STEP_ICONS = [MessageCircle, Search, ClipboardList, CalendarCheck];

export default function HowItWorks({ howItWorks }: { howItWorks: SiteContent["howItWorks"] }) {
  return (
    <section id="como-funciona" className="scroll-mt-24 bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading eyebrow="Como funciona" title="Do primeiro contato ao agendamento" align="center" />
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.steps.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? MessageCircle;
            return (
              <li key={step.title} className="flex flex-col gap-3 rounded-2xl bg-background p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-rose">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                <p className="text-sm leading-relaxed text-ink/70">{step.description}</p>
              </li>
            );
          })}
        </ol>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink/60">{howItWorks.disclaimer}</p>
      </div>
    </section>
  );
}
