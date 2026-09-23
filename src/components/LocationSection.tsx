import { MapPin } from "lucide-react";
import type { SiteContent } from "@/lib/site-content";

const studioMapUrl =
  "https://maps.google.com/maps?q=-15.556557981843605,-56.0569886694866&z=17&hl=pt-BR&output=embed";
const studioMapLink = "https://maps.app.goo.gl/SvScYhrpBscFd7U7A";

export default function LocationSection({ contact }: { contact: SiteContent["contact"] }) {
  const details = [contact.address, contact.hours].filter(Boolean);

  return (
    <section className="bg-wine text-background">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 pb-5 pt-16 text-center sm:px-6 sm:pt-20">
        <MapPin className="h-8 w-8" aria-hidden="true" />
        <h2 className="text-2xl font-semibold sm:text-3xl">{contact.city}</h2>
        {details.length > 0 ? (
          <div className="flex flex-col gap-1 text-sm text-background/80 sm:text-base">
            {details.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : (
          <p className="max-w-md text-sm text-background/80 sm:text-base">{contact.notice}</p>
        )}
      </div>
      <div className="relative w-full">
        <iframe
          title="Localização no Google Maps"
          src={studioMapUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-80 w-full border-0 sm:h-96"
        />
        <a
          href={studioMapLink}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 left-1/2 z-10 inline-flex -translate-x-1/2 rounded-full bg-surface px-5 py-3 text-sm font-medium text-wine hover:bg-rose hover:text-background"
        >
          Ir
        </a>
      </div>
    </section>
  );
}
