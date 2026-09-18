import { AtSign, MapPin } from "lucide-react";
import { location } from "@/config/site";
import WhatsappCta from "./WhatsappCta";

export default function LocationSection() {
  return (
    <section className="bg-wine text-background">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6 sm:py-20">
        <MapPin className="h-8 w-8" aria-hidden="true" />
        <h2 className="text-2xl font-semibold sm:text-3xl">{location.city}</h2>
        <p className="max-w-md text-sm text-background/80 sm:text-base">
          {location.notice}
        </p>
        <a
          href={location.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4 hover:text-surface"
        >
          <AtSign className="h-4 w-4" aria-hidden="true" />
          {location.instagramHandle}
        </a>
        <WhatsappCta messageKey="general" label="Falar pelo WhatsApp" variant="secondary" size="md" />
      </div>
    </section>
  );
}
