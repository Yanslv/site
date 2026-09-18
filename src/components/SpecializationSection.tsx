import { GraduationCap } from "lucide-react";
import { specialization } from "@/config/site";
import SectionHeading from "./SectionHeading";

export default function SpecializationSection() {
  return (
    <section id="especializacao" className="scroll-mt-24 bg-surface/30">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <SectionHeading eyebrow="Especialização" title={specialization.title} align="center" />

        <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-dashed border-rose/40 bg-background p-8">
          <GraduationCap className="h-8 w-8 text-rose" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-ink/70 sm:text-base">
            {specialization.pendingMessage}
          </p>
          <ul className="mt-2 flex flex-wrap justify-center gap-2 text-xs text-ink/50">
            {specialization.placeholderFields.map((field) => (
              <li
                key={field}
                className="rounded-full border border-ink/15 px-3 py-1 uppercase tracking-wide"
              >
                {field}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
