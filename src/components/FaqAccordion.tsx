"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SiteContent } from "@/lib/site-content";
import SectionHeading from "./SectionHeading";

export default function FaqAccordion({ items }: { items: SiteContent["faq"]["items"] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 bg-surface/30">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading eyebrow="Dúvidas" title="Perguntas frequentes" align="center" />

        <div className="mt-10 flex flex-col gap-3">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;

            return (
              <div
                key={item.question}
                className="overflow-hidden rounded-2xl border border-surface bg-background"
              >
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-ink transition-colors hover:text-wine focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wine sm:text-base"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-rose transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 text-sm leading-relaxed text-ink/70 sm:text-base">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
