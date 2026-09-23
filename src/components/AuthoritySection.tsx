import { Sparkles } from "lucide-react";
import type { SiteContent } from "@/lib/site-content";
import MediaImage from "./MediaImage";

export default function AuthoritySection({ authority }: { authority: SiteContent["authority"] }) {
  return (
    <section className="border-y border-surface/70 bg-surface/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 text-center sm:px-6 sm:py-12">
        <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-background shadow-md sm:h-20 sm:w-20">
          <MediaImage src={authority.imagePath} alt={authority.imageAlt} sizes="80px" />
        </div>
        <div className="flex items-center gap-2 text-wine">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium uppercase tracking-[0.14em]">{authority.role}</span>
        </div>
        <h2 className="font-serif-display text-2xl font-semibold text-ink sm:text-3xl">{authority.name}</h2>
        <p className="max-w-2xl text-sm text-ink/70 sm:text-base">
          {authority.focus} · {authority.location}
        </p>
        <p className="max-w-xl text-xs text-ink/55 sm:text-sm">{authority.note}</p>
      </div>
    </section>
  );
}
