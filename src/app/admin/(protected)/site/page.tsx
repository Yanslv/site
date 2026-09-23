import type { Metadata } from "next";
import ErrorBanner from "@/components/admin/ErrorBanner";
import SiteEditor from "@/components/admin/site/SiteEditor";
import { getSiteContent } from "@/server/site-content";

export const metadata: Metadata = { title: "Site | Painel Bendita Micro" };

const SAVED_LABELS: Record<string, string> = {
  brand: "Marca",
  hero: "Hero",
  authority: "Autoridade",
  nanoFios: "Destaque Nano Fios",
  howItWorks: "Como funciona",
  proceduresIntro: "Procedimentos",
  gallery: "Galeria",
  specialization: "Especialização",
  about: "Sobre",
  contact: "Local e WhatsApp",
  faq: "Dúvidas",
  finalCta: "Chamada final",
  seo: "SEO",
};

export default async function AdminSitePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; salvo?: string }>;
}) {
  const { erro, salvo } = await searchParams;
  const site = await getSiteContent();
  const savedLabel = salvo ? SAVED_LABELS[salvo] : undefined;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Site</h1>
        <p className="mt-1 text-sm text-ink/60">
          Textos e fotos da página inicial. Fotos grandes viram WebP de até 4 MB ao salvar. Troque as imagens de referência antes de publicar.
        </p>
      </div>
      <ErrorBanner message={erro} />
      {savedLabel && (
        <p className="rounded-xl bg-surface px-4 py-3 text-sm text-ink">{savedLabel} salvo.</p>
      )}
      <SiteEditor site={site} />
    </div>
  );
}
