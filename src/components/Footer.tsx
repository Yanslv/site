import type { SiteContent } from "@/lib/site-content";

export default function Footer({
  site,
  href,
}: {
  site: Pick<SiteContent, "brand" | "contact">;
  href: string;
}) {
  const year = new Date().getFullYear();
  const brandLine = `${site.brand.name} — ${site.brand.professional}`;

  return (
    <footer className="mt-auto border-t border-surface bg-ink text-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif-display text-lg font-semibold">{brandLine}</p>
          <div className="flex items-center gap-3">
            {site.contact.instagramUrl && (
              <a
                href={site.contact.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/10 hover:bg-background hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            )}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background/10 hover:bg-background hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 13.89c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.81-.11-.42-.14-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.24-.28.64-.41 1.02-.41.12 0 .23 0 .33.01.3.01.44.03.64.49.24.57.82 1.98.89 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.49-.14.14-.28.28-.12.55.16.27.71 1.17 1.52 1.89 1.05.93 1.93 1.22 2.2 1.36.28.14.44.12.6-.07.16-.19.69-.8.88-1.08.19-.27.37-.23.64-.14.26.09 1.67.79 1.96.93.28.14.47.21.54.33.07.12.07.69-.17 1.37z" />
              </svg>
            </a>
          </div>
        </div>
        <p className="text-background/70">{site.contact.city}</p>
        <p className="text-xs text-background/50">
          © {year} {brandLine}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
