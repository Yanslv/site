import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { hero } from "@/config/site";
import WhatsappCta from "./WhatsappCta";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-surface/60 via-background to-background"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="order-2 flex flex-col gap-6 lg:order-1">
          <span className="w-fit rounded-full bg-surface px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-wine sm:text-sm">
            {hero.eyebrow}
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-ink sm:text-5xl lg:text-[3.25rem]">
            {hero.headline}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-ink/75 sm:text-lg">
            {hero.description}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <WhatsappCta messageKey="general" label={hero.primaryCta} size="lg" />
            <a
              href="#procedimentos"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-wine/30 px-7 py-4 text-base font-medium text-wine transition-colors hover:bg-surface"
            >
              {hero.secondaryCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-[2rem] bg-surface shadow-xl shadow-wine/10 sm:max-w-lg">
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 480px, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
