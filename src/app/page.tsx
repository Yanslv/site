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

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <AuthoritySection />
        <NanoFiosFeature />
        <ProcedureGrid />
        <HowItWorks />
        <ResultsGallery />
        <SpecializationSection />
        <AboutSection />
        <LocationSection />
        <FaqAccordion />
        <FinalCtaSection />
      </main>
      <Footer />
      <FloatingWhatsapp />
    </>
  );
}
