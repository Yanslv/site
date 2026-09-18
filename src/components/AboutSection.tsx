import Image from "next/image";
import { about } from "@/config/site";

export default function AboutSection() {
  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] bg-surface shadow-md">
          <Image
            src={about.image.src}
            alt={about.image.alt}
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 400px, 80vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-sm font-medium uppercase tracking-[0.16em] text-rose">
            Sobre a profissional
          </span>
          <h2 className="text-3xl font-semibold text-ink sm:text-4xl">{about.title}</h2>
          <p className="text-base leading-relaxed text-ink/75 sm:text-lg">{about.text}</p>
          <p className="text-xs italic text-ink/45">{about.reviewNote}</p>
        </div>
      </div>
    </section>
  );
}
