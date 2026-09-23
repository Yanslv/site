import type { SiteContent } from "@/lib/site-content";
import MediaImage from "./MediaImage";
import SectionHeading from "./SectionHeading";

export default function ResultsGallery({ gallery }: { gallery: SiteContent["gallery"] }) {
  if (gallery.images.length === 0) return null;

  return (
    <section id="resultados" className="scroll-mt-24 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Resultados e cicatrização"
          title="Referências visuais do estúdio"
          description={gallery.notice}
        />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {gallery.images.map((image) => (
            <figure key={image.src} className="group relative aspect-square overflow-hidden rounded-xl bg-surface">
              <MediaImage
                src={image.src}
                alt={image.alt}
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
