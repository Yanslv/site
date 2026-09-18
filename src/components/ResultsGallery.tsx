import Image from "next/image";
import { galleryImages, resultsGalleryNotice } from "@/config/site";
import SectionHeading from "./SectionHeading";

export default function ResultsGallery() {
  return (
    <section id="resultados" className="scroll-mt-24 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Resultados e cicatrização"
          title="Referências visuais do estúdio"
          description={resultsGalleryNotice}
        />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {galleryImages.map((image) => (
            <figure
              key={image.src}
              className="group relative aspect-square overflow-hidden rounded-xl bg-surface"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-ink/75 px-2 py-1.5 text-center text-[10px] font-medium text-background sm:text-xs">
                {image.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
