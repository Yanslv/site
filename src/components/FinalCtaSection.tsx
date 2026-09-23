import type { SiteContent } from "@/lib/site-content";
import WhatsappCta from "./WhatsappCta";

export default function FinalCtaSection({
  finalCta,
  href,
}: {
  finalCta: SiteContent["finalCta"];
  href: string;
}) {
  return (
    <section className="bg-background">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="text-3xl font-semibold text-ink sm:text-4xl">{finalCta.title}</h2>
        <p className="max-w-xl text-base text-ink/70 sm:text-lg">{finalCta.description}</p>
        <WhatsappCta href={href} label={finalCta.buttonLabel} size="lg" />
      </div>
    </section>
  );
}
