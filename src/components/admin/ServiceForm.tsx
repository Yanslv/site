import type { Service } from "@/db/schema";
import { MoneyField, SlugField } from "@/components/admin/MaskedFields";
import CompressedImageInput from "@/components/admin/site/CompressedImageInput";
import ReturnIntervalFields from "@/components/admin/ReturnIntervalFields";

export default function ServiceForm({
  action,
  service,
}: {
  action: (formData: FormData) => void;
  service?: Service;
}) {
  return (
    <form action={action} className="flex flex-col gap-5">
      {service && <input type="hidden" name="id" value={service.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-ink/80">
            Nome
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={service?.name}
            className="rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
          />
        </div>
        <SlugField id="slug" defaultValue={service?.slug} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-ink/80">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={service?.description ?? ""}
          className="rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium text-ink/80">
            Categoria
          </label>
          <input
            id="category"
            name="category"
            defaultValue={service?.category ?? ""}
            className="rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink/80">Foto</span>
          <input type="hidden" name="imagePath" value={service?.imagePath ?? ""} />
          <CompressedImageInput name="image" previewPath={service?.imagePath ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="durationMinutes" className="text-sm font-medium text-ink/80">
            Duração (min)
          </label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={5}
            required
            defaultValue={service?.durationMinutes ?? 60}
            className="rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
          />
        </div>
        <MoneyField id="priceCents" name="priceCents" label="Preço" defaultCents={service?.priceCents ?? 0} required />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="color" className="text-sm font-medium text-ink/80">
            Cor
          </label>
          <input
            id="color"
            name="color"
            type="color"
            required
            defaultValue={service?.color ?? "#B86F78"}
            className="h-11 w-full cursor-pointer rounded-xl border border-surface bg-background px-2 py-1"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sortOrder" className="text-sm font-medium text-ink/80">
            Ordem
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            required
            defaultValue={service?.sortOrder ?? 0}
            className="rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
          />
        </div>
      </div>

      <ReturnIntervalFields
        hasReturn={service?.hasReturn ?? false}
        returnAmount={service?.returnAmount ?? null}
        returnUnit={service?.returnUnit ?? null}
      />

      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input
          type="checkbox"
          name="active"
          defaultChecked={service?.active ?? true}
          className="h-4 w-4 rounded border-surface text-wine focus:ring-wine/30"
        />
        Ativo (visível na landing page e no agendamento)
      </label>

      <button
        type="submit"
        className="inline-flex w-fit items-center justify-center rounded-full bg-wine px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-ink"
      >
        {service ? "Salvar alterações" : "Criar serviço"}
      </button>
    </form>
  );
}
