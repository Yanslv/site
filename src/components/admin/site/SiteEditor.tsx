import { saveSiteSectionAction } from "@/app/actions/admin-site";
import CompressedImageInput from "@/components/admin/site/CompressedImageInput";
import { WhatsappField } from "@/components/admin/MaskedFields";
import type { SiteContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20";

function TextInput({
  label,
  name,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink/80">{label}</span>
      <input name={name} defaultValue={defaultValue} required={required} className={inputClass} />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink/80">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={rows} className={inputClass} />
    </label>
  );
}

function PhotoField({
  label,
  fileName,
  pathName,
  altName,
  path,
  alt,
}: {
  label: string;
  fileName: string;
  pathName: string;
  altName: string;
  path: string;
  alt: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={pathName} value={path} />
      <span className="text-sm font-medium text-ink/80">{label}</span>
      <CompressedImageInput name={fileName} previewPath={path} />
      <TextInput label="Texto alternativo" name={altName} defaultValue={alt} />
    </div>
  );
}

function SectionForm({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-surface bg-background p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <form action={saveSiteSectionAction} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="section" value={id} />
        {children}
        <button
          type="submit"
          className="inline-flex w-fit rounded-full bg-wine px-6 py-2.5 text-sm font-medium text-background hover:bg-ink"
        >
          Salvar seção
        </button>
      </form>
    </section>
  );
}

export default function SiteEditor({ site }: { site: SiteContent }) {
  const gallerySlots = Array.from({ length: 8 }, (_, index) => site.gallery.images[index]);
  const faqSlots = Array.from({ length: 8 }, (_, index) => site.faq.items[index]);
  const stepSlots = Array.from({ length: 4 }, (_, index) => site.howItWorks.steps[index]);
  const courseSlots = Array.from({ length: 6 }, (_, index) => site.specialization.items[index]);

  return (
    <div className="flex flex-col gap-6">
      <SectionForm id="brand" title="Marca">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Nome da marca" name="name" defaultValue={site.brand.name} required />
          <TextInput label="Profissional" name="professional" defaultValue={site.brand.professional} required />
        </div>
      </SectionForm>

      <SectionForm id="hero" title="Hero">
        <TextInput label="Linha de apoio" name="eyebrow" defaultValue={site.hero.eyebrow} />
        <TextInput label="Título" name="headline" defaultValue={site.hero.headline} required />
        <TextArea label="Descrição" name="description" defaultValue={site.hero.description} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Botão principal" name="primaryCta" defaultValue={site.hero.primaryCta} required />
          <TextInput label="Botão secundário" name="secondaryCta" defaultValue={site.hero.secondaryCta} required />
        </div>
        <PhotoField
          label="Foto"
          fileName="image"
          pathName="imagePath"
          altName="imageAlt"
          path={site.hero.imagePath}
          alt={site.hero.imageAlt}
        />
      </SectionForm>

      <SectionForm id="authority" title="Autoridade">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Nome" name="name" defaultValue={site.authority.name} required />
          <TextInput label="Função" name="role" defaultValue={site.authority.role} required />
          <TextInput label="Foco" name="focus" defaultValue={site.authority.focus} />
          <TextInput label="Local" name="location" defaultValue={site.authority.location} />
        </div>
        <TextArea label="Nota" name="note" defaultValue={site.authority.note} />
        <PhotoField
          label="Foto"
          fileName="image"
          pathName="imagePath"
          altName="imageAlt"
          path={site.authority.imagePath}
          alt={site.authority.imageAlt}
        />
      </SectionForm>

      <SectionForm id="nanoFios" title="Destaque Nano Fios">
        <TextInput label="Título" name="title" defaultValue={site.nanoFios.title} required />
        <TextArea label="Descrição" name="description" defaultValue={site.nanoFios.description} />
        <TextInput label="Botão" name="cta" defaultValue={site.nanoFios.cta} required />
        <TextArea label="Mensagem do WhatsApp" name="message" defaultValue={site.nanoFios.message} />
        <TextInput label="Nota da foto pequena" name="precisionNote" defaultValue={site.nanoFios.precisionNote} />
        <PhotoField
          label="Foto principal"
          fileName="image"
          pathName="imagePath"
          altName="imageAlt"
          path={site.nanoFios.imagePath}
          alt={site.nanoFios.imageAlt}
        />
        <PhotoField
          label="Foto de detalhe"
          fileName="precisionImage"
          pathName="precisionImagePath"
          altName="precisionImageAlt"
          path={site.nanoFios.precisionImagePath}
          alt={site.nanoFios.precisionImageAlt}
        />
      </SectionForm>

      <SectionForm id="howItWorks" title="Como funciona">
        {stepSlots.map((step, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-surface p-4 sm:grid-cols-2">
            <TextInput label={`Passo ${index + 1} — título`} name={`stepTitle-${index}`} defaultValue={step?.title ?? ""} />
            <TextInput label="Descrição" name={`stepDescription-${index}`} defaultValue={step?.description ?? ""} />
          </div>
        ))}
        <TextArea label="Aviso" name="disclaimer" defaultValue={site.howItWorks.disclaimer} />
      </SectionForm>

      <SectionForm id="proceduresIntro" title="Introdução dos procedimentos">
        <TextInput label="Título" name="title" defaultValue={site.proceduresIntro.title} required />
        <TextArea label="Descrição" name="description" defaultValue={site.proceduresIntro.description} />
      </SectionForm>

      <SectionForm id="gallery" title="Galeria">
        <TextArea label="Aviso da galeria" name="notice" defaultValue={site.gallery.notice} />
        {gallerySlots.map((image, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-surface p-4">
            <PhotoField
              label={`Foto ${index + 1}`}
              fileName={`file-${index}`}
              pathName={`src-${index}`}
              altName={`alt-${index}`}
              path={image?.src ?? ""}
              alt={image?.alt ?? ""}
            />
            <TextInput label="Legenda" name={`caption-${index}`} defaultValue={image?.caption ?? ""} />
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input type="checkbox" name={`remove-${index}`} />
              Remover esta foto
            </label>
          </div>
        ))}
      </SectionForm>

      <SectionForm id="specialization" title="Especialização">
        <TextInput label="Título" name="title" defaultValue={site.specialization.title} required />
        <TextArea label="Texto" name="intro" defaultValue={site.specialization.intro} />
        {courseSlots.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-surface p-4 sm:grid-cols-2">
            <TextInput label={`Formação ${index + 1}`} name={`itemName-${index}`} defaultValue={item?.name ?? ""} />
            <TextInput label="Instituição" name={`itemInstitution-${index}`} defaultValue={item?.institution ?? ""} />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink/80">Ano</span>
              <input
                name={`itemYear-${index}`}
                inputMode="numeric"
                maxLength={4}
                defaultValue={item?.year ?? ""}
                placeholder="2024"
                className={inputClass}
              />
            </label>
            <TextInput label="Descrição" name={`itemDescription-${index}`} defaultValue={item?.description ?? ""} />
            <div className="sm:col-span-2">
              <PhotoField
                label="Foto da especialização"
                fileName={`itemImage-${index}`}
                pathName={`itemImagePath-${index}`}
                altName={`itemImageAlt-${index}`}
                path={item?.imagePath ?? ""}
                alt={item?.imageAlt ?? ""}
              />
            </div>
          </div>
        ))}
      </SectionForm>

      <SectionForm id="about" title="Sobre">
        <TextInput label="Título" name="title" defaultValue={site.about.title} required />
        <TextArea label="Texto" name="text" defaultValue={site.about.text} rows={5} />
        <PhotoField
          label="Foto"
          fileName="image"
          pathName="imagePath"
          altName="imageAlt"
          path={site.about.imagePath}
          alt={site.about.imageAlt}
        />
      </SectionForm>

      <SectionForm id="contact" title="Local e WhatsApp">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Cidade" name="city" defaultValue={site.contact.city} required />
          <TextInput label="Endereço" name="address" defaultValue={site.contact.address} />
          <TextInput label="Horários" name="hours" defaultValue={site.contact.hours} />
          <TextInput label="Instagram" name="instagramHandle" defaultValue={site.contact.instagramHandle} />
        </div>
        <TextInput label="Link do Instagram" name="instagramUrl" defaultValue={site.contact.instagramUrl} />
        <TextArea label="Aviso quando o endereço ainda não estiver preenchido" name="notice" defaultValue={site.contact.notice} />
        <WhatsappField id="whatsappNumber" name="whatsappNumber" label="WhatsApp" defaultValue={site.contact.whatsappNumber} />
        <TextInput label="Link público do WhatsApp" name="whatsappPublicLink" defaultValue={site.contact.whatsappPublicLink} />
        <TextArea label="Mensagem padrão" name="whatsappMessage" defaultValue={site.contact.whatsappMessage} />
      </SectionForm>

      <SectionForm id="faq" title="Dúvidas">
        {faqSlots.map((item, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-xl border border-surface p-4">
            <TextInput label={`Pergunta ${index + 1}`} name={`question-${index}`} defaultValue={item?.question ?? ""} />
            <TextArea label="Resposta" name={`answer-${index}`} defaultValue={item?.answer ?? ""} />
          </div>
        ))}
      </SectionForm>

      <SectionForm id="finalCta" title="Chamada final">
        <TextInput label="Título" name="title" defaultValue={site.finalCta.title} required />
        <TextArea label="Descrição" name="description" defaultValue={site.finalCta.description} />
        <TextInput label="Botão" name="buttonLabel" defaultValue={site.finalCta.buttonLabel} required />
      </SectionForm>

      <SectionForm id="seo" title="SEO">
        <TextInput label="Título da página" name="title" defaultValue={site.seo.title} required />
        <TextArea label="Descrição" name="description" defaultValue={site.seo.description} />
      </SectionForm>
    </div>
  );
}
