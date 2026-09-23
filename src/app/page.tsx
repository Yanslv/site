import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AuthoritySection from "@/components/AuthoritySection";
import NanoFiosFeature from "@/components/NanoFiosFeature";
import ProcedureGrid from "@/components/ProcedureGrid";
import HowItWorks from "@/components/HowItWorks";
import ResultsGallery from "@/components/ResultsGallery";
import SpecializationSection from "@/components/SpecializationSection";
import AboutSection from "@/components/AboutSection";
import LocationSection from "@/components/LocationSection";
import FaqAccordion from "@/components/FaqAccordion";
import FinalCtaSection from "@/components/FinalCtaSection";
import Footer from "@/components/Footer";
import FloatingWhatsapp from "@/components/FloatingWhatsapp";
import { getSiteContent } from "@/server/site-content";
import { whatsappHref } from "@/lib/whatsapp";

export default async function Home() {
  const site = await getSiteContent();
  const generalHref = whatsappHref({
    number: site.contact.whatsappNumber,
    publicLink: site.contact.whatsappPublicLink,
    message: site.contact.whatsappMessage,
  });
  const nanoHref = whatsappHref({
    number: site.contact.whatsappNumber,
    publicLink: site.contact.whatsappPublicLink,
    message: site.nanoFios.message,
  });

  return (
    <>
      <Header brandName={site.brand.name} professional={site.brand.professional} />
      <main>
        <Hero hero={site.hero} href={generalHref} />
        <AuthoritySection authority={site.authority} />
        <NanoFiosFeature nanoFios={site.nanoFios} href={nanoHref} />
        <ProcedureGrid intro={site.proceduresIntro} contact={site.contact} />
        <HowItWorks howItWorks={site.howItWorks} />
        <ResultsGallery gallery={site.gallery} />
        <SpecializationSection specialization={site.specialization} />
        <AboutSection about={site.about} />
        <LocationSection contact={site.contact} />
        <FaqAccordion items={site.faq.items} />
        <FinalCtaSection finalCta={site.finalCta} href={generalHref} />
      </main>
      <Footer site={site} href={generalHref} />
      <FloatingWhatsapp href={generalHref} />
    </>
  );
}
