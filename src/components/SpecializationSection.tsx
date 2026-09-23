"use client";

import { useEffect, useState, type TransitionEvent } from "react";
import { GraduationCap } from "lucide-react";
import type { SiteContent } from "@/lib/site-content";
import MediaImage from "./MediaImage";
import SectionHeading from "./SectionHeading";

const VISIBLE_COUNT = 3;
const SLIDE_INTERVAL_MS = 4000;

type SpecializationItem = SiteContent["specialization"]["items"][number];

function CertificateCard({ item }: { item: SpecializationItem }) {
  const meta = [item.institution, item.year].filter(Boolean).join(" · ");

  return (
    <article className="flex h-full flex-col gap-3 text-left">
      <div className="relative aspect-[4/3] rounded-md bg-[#efe4d8] p-2.5 shadow-[0_22px_40px_-28px_rgba(43,32,34,0.85)]">
        <div className="pointer-events-none absolute inset-1.5 rounded-[3px] border border-[#c9b29d]" />
        <div className="relative h-full overflow-hidden rounded-[2px] bg-background shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)]">
          {item.imagePath ? (
            <MediaImage
              src={item.imagePath}
              alt={item.imageAlt || item.name}
              sizes="(min-width: 1024px) 280px, 30vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-surface/50">
              <GraduationCap className="h-8 w-8 text-rose" aria-hidden="true" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/45 via-white/0 to-white/15" />
          <div className="certificate-sheen pointer-events-none absolute inset-y-[-12%] left-0 w-[28%] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
      </div>
      <div>
        <h3 className="text-base font-semibold text-ink">{item.name}</h3>
        {meta && <p className="mt-1 text-sm text-ink/60">{meta}</p>}
        {item.description && <p className="mt-2 text-sm leading-relaxed text-ink/70">{item.description}</p>}
      </div>
    </article>
  );
}

export default function SpecializationSection({
  specialization,
}: {
  specialization: SiteContent["specialization"];
}) {
  const items = specialization.items;
  const slides = items.length > VISIBLE_COUNT;
  const track = slides ? [...items, ...items.slice(0, VISIBLE_COUNT)] : items;
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    if (!slides) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setAnimate(true);
      setIndex((current) => current + 1);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [slides]);

  useEffect(() => {
    if (animate) return;
    const frame = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, [animate]);

  function onTrackTransitionEnd(event: TransitionEvent<HTMLUListElement>) {
    if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
    if (index < items.length) return;
    setAnimate(false);
    setIndex(0);
  }

  return (
    <section id="especializacao" className="scroll-mt-24 bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading eyebrow="Especialização" title={specialization.title} align="center" />
        {specialization.intro && (
          <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-relaxed text-ink/70 sm:text-base">
            {specialization.intro}
          </p>
        )}
        {items.length > 0 && (
          <div className="certificate-window mx-auto mt-10 max-w-5xl overflow-hidden">
            <ul
              className={`certificate-track flex ${animate ? "transition-transform duration-700 ease-out" : ""}`}
              style={{
                width: `${(track.length / VISIBLE_COUNT) * 100}%`,
                transform: `translateX(-${(index * 100) / track.length}%)`,
              }}
              onTransitionEnd={onTrackTransitionEnd}
            >
              {track.map((item, itemIndex) => (
                <li
                  key={`${item.name}-${item.year}-${itemIndex}`}
                  data-clone={itemIndex >= items.length ? "true" : undefined}
                  aria-hidden={itemIndex >= items.length ? true : undefined}
                  className="px-2"
                  style={{ width: `${100 / track.length}%` }}
                >
                  <CertificateCard item={item} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
