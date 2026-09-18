import Image from "next/image";
import { nanoFiosFeature } from "@/config/site";
import WhatsappCta from "./WhatsappCta";

export default function NanoFiosFeature() {
  return (
    <section className="bg-wine text-background">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
        <div className="relative order-2 lg:order-1">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-xl shadow-black/20">
            <Image
              src={nanoFiosFeature.image.src}
              alt={nanoFiosFeature.image.alt}
              fill
              loading="lazy"
              sizes="(min-width: 1024px) 480px, 90vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-4 flex w-40 items-center gap-3 rounded-2xl bg-background p-3 text-ink shadow-lg sm:w-48">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-16">
              <Image
                src={nanoFiosFeature.precisionImage.src}
                alt={nanoFiosFeature.precisionImage.alt}
                fill
                loading="lazy"
                sizes="64px"
                className="object-cover"
              />
            </div>
            <p className="text-[11px] leading-snug text-ink/70">
              {nanoFiosFeature.precisionNote}
            </p>
          </div>
        </div>

        <div className="order-1 flex flex-col gap-5 lg:order-2">
          <span className="w-fit rounded-full bg-background/15 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] sm:text-sm">
            Procedimento principal
          </span>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            {nanoFiosFeature.title}
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-background/85 sm:text-lg">
            {nanoFiosFeature.description}
          </p>
          <div>
            <WhatsappCta
              messageKey="nanoFios"
              label={nanoFiosFeature.cta}
              variant="secondary"
              size="lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
