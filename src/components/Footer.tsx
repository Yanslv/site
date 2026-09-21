import { AtSign } from "lucide-react";
import { footer, location, getWhatsappUrl } from "@/config/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-surface bg-ink text-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif-display text-lg font-semibold">{footer.brandLine}</p>
          <div className="flex items-center gap-4">
            <a
              href={location.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-surface"
            >
              <AtSign className="h-4 w-4" aria-hidden="true" />
              {location.instagramHandle}
            </a>
            <a
              href={getWhatsappUrl("general")}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-surface"
            >
              WhatsApp
            </a>
          </div>
        </div>
        <p className="text-background/70">{footer.city}</p>
        <p className="text-xs text-background/50">
          © {year} {footer.brandLine}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
