"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isCanonicalWhatsapp, whatsappToCanonical } from "@/lib/masks";
import {
  aboutSchema,
  authoritySchema,
  brandSchema,
  contactSchema,
  faqSchema,
  finalCtaSchema,
  gallerySchema,
  heroSchema,
  howItWorksSchema,
  nanoFiosSchema,
  proceduresIntroSchema,
  seoSchema,
  specializationSchema,
  type SiteContent,
  type SiteSection,
} from "@/lib/site-content";
import { getSiteContent, saveSiteContent } from "@/server/site-content";
import { saveSiteImage } from "@/server/site-images";

const SECTIONS: SiteSection[] = [
  "brand",
  "hero",
  "authority",
  "nanoFios",
  "howItWorks",
  "proceduresIntro",
  "gallery",
  "specialization",
  "about",
  "contact",
  "faq",
  "finalCta",
  "seo",
];

function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function parseSection<T>(result: { success: true; data: T } | { success: false; error: { issues: { message: string }[] } }): T {
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Dados inválidos.");
  }
  return result.data;
}

async function imageFromForm(formData: FormData, fileKey: string, pathKey: string): Promise<string> {
  const file = formData.get(fileKey);
  if (file instanceof File && file.size > 0) return saveSiteImage(file);
  const current = field(formData, pathKey);
  if (current.startsWith("/assets/") || current.startsWith("/site-media/")) return current;
  return "";
}

function filledRows<T>(count: number, read: (index: number) => T | null): T[] {
  const rows: T[] = [];
  for (let index = 0; index < count; index += 1) {
    const row = read(index);
    if (row) rows.push(row);
  }
  return rows;
}

function httpsLink(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("https://")) {
    throw new Error(`${label} precisa começar com https://`);
  }
  return trimmed;
}

async function readSection(section: SiteSection, formData: FormData): Promise<SiteContent[SiteSection]> {
  if (section === "brand") {
    return parseSection(brandSchema.safeParse({
      name: field(formData, "name"),
      professional: field(formData, "professional"),
    }));
  }
  if (section === "hero") {
    return parseSection(heroSchema.safeParse({
      eyebrow: field(formData, "eyebrow"),
      headline: field(formData, "headline"),
      description: field(formData, "description"),
      primaryCta: field(formData, "primaryCta"),
      secondaryCta: field(formData, "secondaryCta"),
      imagePath: await imageFromForm(formData, "image", "imagePath"),
      imageAlt: field(formData, "imageAlt"),
    }));
  }
  if (section === "authority") {
    return parseSection(authoritySchema.safeParse({
      name: field(formData, "name"),
      role: field(formData, "role"),
      focus: field(formData, "focus"),
      location: field(formData, "location"),
      note: field(formData, "note"),
      imagePath: await imageFromForm(formData, "image", "imagePath"),
      imageAlt: field(formData, "imageAlt"),
    }));
  }
  if (section === "nanoFios") {
    return parseSection(nanoFiosSchema.safeParse({
      title: field(formData, "title"),
      description: field(formData, "description"),
      cta: field(formData, "cta"),
      message: field(formData, "message"),
      imagePath: await imageFromForm(formData, "image", "imagePath"),
      imageAlt: field(formData, "imageAlt"),
      precisionImagePath: await imageFromForm(formData, "precisionImage", "precisionImagePath"),
      precisionImageAlt: field(formData, "precisionImageAlt"),
      precisionNote: field(formData, "precisionNote"),
    }));
  }
  if (section === "howItWorks") {
    return parseSection(howItWorksSchema.safeParse({
      disclaimer: field(formData, "disclaimer"),
      steps: filledRows(4, (index) => {
        const title = field(formData, `stepTitle-${index}`);
        const description = field(formData, `stepDescription-${index}`);
        if (!title && !description) return null;
        return { title, description };
      }),
    }));
  }
  if (section === "proceduresIntro") {
    return parseSection(proceduresIntroSchema.safeParse({
      title: field(formData, "title"),
      description: field(formData, "description"),
    }));
  }
  if (section === "gallery") {
    const images = [];
    for (let index = 0; index < 8; index += 1) {
      if (formData.get(`remove-${index}`) === "on") continue;
      const src = await imageFromForm(formData, `file-${index}`, `src-${index}`);
      const alt = field(formData, `alt-${index}`);
      const caption = field(formData, `caption-${index}`);
      if (!src && !alt && !caption) continue;
      images.push({ src, alt, caption });
    }
    return parseSection(gallerySchema.safeParse({
      notice: field(formData, "notice"),
      images,
    }));
  }
  if (section === "specialization") {
    const items = [];
    for (let index = 0; index < 6; index += 1) {
      const name = field(formData, `itemName-${index}`);
      if (!name) continue;
      items.push({
        name,
        institution: field(formData, `itemInstitution-${index}`),
        year: field(formData, `itemYear-${index}`),
        description: field(formData, `itemDescription-${index}`),
        imagePath: await imageFromForm(formData, `itemImage-${index}`, `itemImagePath-${index}`),
        imageAlt: field(formData, `itemImageAlt-${index}`),
      });
    }
    return parseSection(specializationSchema.safeParse({
      title: field(formData, "title"),
      intro: field(formData, "intro"),
      items,
    }));
  }
  if (section === "about") {
    return parseSection(aboutSchema.safeParse({
      title: field(formData, "title"),
      text: field(formData, "text"),
      imagePath: await imageFromForm(formData, "image", "imagePath"),
      imageAlt: field(formData, "imageAlt"),
    }));
  }
  if (section === "contact") {
    const rawNumber = field(formData, "whatsappNumber").trim();
    const whatsappNumber = rawNumber ? whatsappToCanonical(rawNumber) : "";
    if (whatsappNumber && !isCanonicalWhatsapp(whatsappNumber)) {
      throw new Error("Informe um WhatsApp válido, com DDD.");
    }
    return parseSection(contactSchema.safeParse({
      city: field(formData, "city"),
      address: field(formData, "address"),
      hours: field(formData, "hours"),
      notice: field(formData, "notice"),
      instagramUrl: httpsLink(field(formData, "instagramUrl"), "O Instagram"),
      instagramHandle: field(formData, "instagramHandle"),
      whatsappNumber,
      whatsappPublicLink: httpsLink(field(formData, "whatsappPublicLink"), "O link público do WhatsApp"),
      whatsappMessage: field(formData, "whatsappMessage"),
    }));
  }
  if (section === "faq") {
    return parseSection(faqSchema.safeParse({
      items: filledRows(8, (index) => {
        const question = field(formData, `question-${index}`);
        const answer = field(formData, `answer-${index}`);
        if (!question && !answer) return null;
        return { question, answer };
      }),
    }));
  }
  if (section === "finalCta") {
    return parseSection(finalCtaSchema.safeParse({
      title: field(formData, "title"),
      description: field(formData, "description"),
      buttonLabel: field(formData, "buttonLabel"),
    }));
  }
  return parseSection(seoSchema.safeParse({
    title: field(formData, "title"),
    description: field(formData, "description"),
  }));
}

export async function saveSiteSectionAction(formData: FormData): Promise<void> {
  await requireUser();
  const section = field(formData, "section") as SiteSection;
  if (!SECTIONS.includes(section)) {
    redirect("/admin/site?erro=Se%C3%A7%C3%A3o%20inv%C3%A1lida.");
  }

  try {
    const value = await readSection(section, formData);
    const current = await getSiteContent();
    await saveSiteContent({ ...current, [section]: value });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar.";
    redirect(`/admin/site?erro=${encodeURIComponent(message)}#${section}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/site");
  redirect(`/admin/site?salvo=${section}#${section}`);
}
