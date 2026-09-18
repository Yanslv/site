import type { Service } from "@/db/schema";

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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="slug" className="text-sm font-medium text-ink/80">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            required
            defaultValue={service?.slug}
            placeholder="nano-fios"
            className="rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
          />
        </div>
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
          <label htmlFor="imagePath" className="text-sm font-medium text-ink/80">
            Caminho da imagem
          </label>
          <input
            id="imagePath"
            name="imagePath"
            defaultValue={service?.imagePath ?? ""}
            placeholder="/assets/asset_010_....jpg"
            className="rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
          />
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="priceCents" className="text-sm font-medium text-ink/80">
            Preço (centavos)
          </label>
          <input
            id="priceCents"
            name="priceCents"
            type="number"
            min={0}
            required
            defaultValue={service?.priceCents ?? 0}
            className="rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="color" className="text-sm font-medium text-ink/80">
            Cor
          </label>
          <input
            id="color"
            name="color"
            type="text"
            required
            defaultValue={service?.color ?? "#B86F78"}
            className="rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
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

      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input
          type="checkbox"
          name="active"
          defaultChecked={service?.active ?? true}
          className="h-4 w-4 rounded border-surface text-wine focus:ring-wine/30"
        />
        Ativo (visível na landing page e no agendamento)
      </label>

      <p className="text-xs text-ink/50">
        Preço em centavos: R$ 650,00 = 65000. Duração em minutos.
      </p>

      <button
        type="submit"
        className="inline-flex w-fit items-center justify-center rounded-full bg-wine px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-ink"
      >
        {service ? "Salvar alterações" : "Criar serviço"}
      </button>
    </form>
  );
}
