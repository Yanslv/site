import { z } from "zod";
import {
  about,
  authority,
  brand,
  faqItems,
  finalCta,
  galleryImages,
  hero,
  howItWorksDisclaimer,
  howItWorksSteps,
  images,
  location,
  nanoFiosFeature,
  resultsGalleryNotice,
  seo,
  specialization,
  whatsapp,
} from "@/config/site";

const text = (max: number) => z.string().trim().max(max);
const imagePath = z
  .string()
  .trim()
  .max(200)
  .refine((value) => value === "" || value.startsWith("/assets/") || value.startsWith("/site-media/"), "Imagem inválida");

export const heroSchema = z.object({
  eyebrow: text(80),
  headline: text(180),
  description: text(500),
  primaryCta: text(60),
  secondaryCta: text(60),
  imagePath,
  imageAlt: text(220),
});

export const authoritySchema = z.object({
  name: text(80),
  role: text(140),
  focus: text(140),
  location: text(80),
  note: text(400),
  imagePath,
  imageAlt: text(220),
});

export const nanoFiosSchema = z.object({
  title: text(180),
  description: text(600),
  cta: text(60),
  message: text(300),
  imagePath,
  imageAlt: text(220),
  precisionImagePath: imagePath,
  precisionImageAlt: text(220),
  precisionNote: text(220),
});

export const stepSchema = z.object({
  title: text(80),
  description: text(240),
});

export const howItWorksSchema = z.object({
  steps: z.array(stepSchema).max(4),
  disclaimer: text(300),
});

export const galleryImageSchema = z.object({
  src: imagePath,
  alt: text(220),
  caption: text(80),
});

export const gallerySchema = z.object({
  notice: text(400),
  images: z.array(galleryImageSchema).max(8),
});

export const specializationItemSchema = z.object({
  name: text(120),
  institution: text(120),
  year: text(8),
  description: text(240),
  imagePath: imagePath.optional().default(""),
  imageAlt: text(220).optional().default(""),
});

export const specializationSchema = z.object({
  title: text(140),
  intro: text(400),
  items: z.array(specializationItemSchema).max(6),
});

export const aboutSchema = z.object({
  title: text(80),
  text: text(1200),
  imagePath,
  imageAlt: text(220),
});

export const contactSchema = z.object({
  city: text(60),
  address: text(180),
  hours: text(180),
  notice: text(240),
  instagramUrl: z.string().trim().max(200),
  instagramHandle: text(60),
  whatsappNumber: text(20),
  whatsappPublicLink: z.string().trim().max(300),
  whatsappMessage: text(300),
});

export const faqItemSchema = z.object({
  question: text(180),
  answer: text(600),
});

export const faqSchema = z.object({
  items: z.array(faqItemSchema).max(8),
});

export const finalCtaSchema = z.object({
  title: text(160),
  description: text(300),
  buttonLabel: text(60),
});

export const seoSchema = z.object({
  title: text(80),
  description: text(200),
});

export const proceduresIntroSchema = z.object({
  title: text(80),
  description: text(300),
});

export const brandSchema = z.object({
  name: text(60),
  professional: text(80),
});

export const siteContentSchema = z.object({
  brand: brandSchema,
  hero: heroSchema,
  authority: authoritySchema,
  nanoFios: nanoFiosSchema,
  howItWorks: howItWorksSchema,
  gallery: gallerySchema,
  specialization: specializationSchema,
  about: aboutSchema,
  contact: contactSchema,
  faq: faqSchema,
  finalCta: finalCtaSchema,
  seo: seoSchema,
  proceduresIntro: proceduresIntroSchema,
});

export type SiteContent = z.infer<typeof siteContentSchema>;
export type SiteSection = keyof SiteContent;

export const defaultSiteContent: SiteContent = {
  brand: { name: brand.name, professional: brand.professional },
  hero: {
    eyebrow: hero.eyebrow,
    headline: hero.headline,
    description: hero.description,
    primaryCta: hero.primaryCta,
    secondaryCta: hero.secondaryCta,
    imagePath: hero.image.src,
    imageAlt: hero.image.alt,
  },
  authority: {
    name: authority.name,
    role: authority.role,
    focus: authority.focus,
    location: authority.location,
    note: authority.note,
    imagePath: images.professionalEnvironment.src,
    imageAlt: images.professionalEnvironment.alt,
  },
  nanoFios: {
    title: nanoFiosFeature.title,
    description: nanoFiosFeature.description,
    cta: nanoFiosFeature.cta,
    message: whatsapp.messages.nanoFios,
    imagePath: nanoFiosFeature.image.src,
    imageAlt: nanoFiosFeature.image.alt,
    precisionImagePath: nanoFiosFeature.precisionImage.src,
    precisionImageAlt: nanoFiosFeature.precisionImage.alt,
    precisionNote: nanoFiosFeature.precisionNote,
  },
  howItWorks: {
    steps: howItWorksSteps.map((step) => ({ title: step.title, description: step.description })),
    disclaimer: howItWorksDisclaimer,
  },
  gallery: {
    notice: resultsGalleryNotice,
    images: galleryImages.map((image) => ({
      src: image.src,
      alt: image.alt,
      caption: image.caption,
    })),
  },
  specialization: {
    title: specialization.title,
    intro: specialization.pendingMessage,
    items: [],
  },
  about: {
    title: about.title,
    text: about.text,
    imagePath: about.image.src,
    imageAlt: about.image.alt,
  },
  contact: {
    city: location.city,
    address: "",
    hours: "",
    notice: location.notice,
    instagramUrl: location.instagramUrl,
    instagramHandle: location.instagramHandle,
    whatsappNumber: "",
    whatsappPublicLink: whatsapp.publicLink,
    whatsappMessage: whatsapp.messages.general,
  },
  faq: {
    items: faqItems.map((item) => ({ question: item.question, answer: item.answer })),
  },
  finalCta: {
    title: finalCta.title,
    description: finalCta.description,
    buttonLabel: finalCta.buttonLabel,
  },
  seo: {
    title: seo.title,
    description: seo.description,
  },
  proceduresIntro: {
    title: "Serviços da Bendita Micro",
    description:
      "Conheça as especialidades da Ioná, veja preço e duração e tire suas dúvidas antes de escolher o procedimento ideal para você.",
  },
};

export function parseSiteContent(raw: string | null): SiteContent {
  if (!raw) return defaultSiteContent;
  try {
    const parsed = siteContentSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : defaultSiteContent;
  } catch {
    return defaultSiteContent;
  }
}
