"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { serviceSchema } from "@/lib/validation/service";
import { createService, updateService, setServiceActive } from "@/server/services";
import { saveSiteImage } from "@/server/site-images";

function errorRedirect(basePath: string, message: string): never {
  redirect(`${basePath}?erro=${encodeURIComponent(message)}`);
}

async function imagePathFromForm(formData: FormData): Promise<string> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) return saveSiteImage(file);
  const current = String(formData.get("imagePath") ?? "").trim();
  if (current.startsWith("/assets/") || current.startsWith("/site-media/")) return current;
  return "";
}

async function parseServiceForm(formData: FormData) {
  return serviceSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    category: formData.get("category"),
    durationMinutes: formData.get("durationMinutes"),
    priceCents: formData.get("priceCents"),
    active: formData.get("active") === "on",
    imagePath: await imagePathFromForm(formData),
    color: formData.get("color"),
    sortOrder: formData.get("sortOrder"),
    hasReturn: formData.get("hasReturn") === "on",
    returnAmount: formData.get("returnAmount"),
    returnUnit: formData.get("returnUnit"),
  });
}

export async function createServiceAction(formData: FormData): Promise<void> {
  await requireUser();
  const parsed = await parseServiceForm(formData).catch((cause: unknown) => {
    errorRedirect("/admin/servicos/novo", cause instanceof Error ? cause.message : "Não foi possível salvar a foto.");
  });
  if (!parsed.success) {
    errorRedirect("/admin/servicos/novo", parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  await createService(parsed.data);
  revalidatePath("/admin/servicos");
  revalidatePath("/");
  redirect("/admin/servicos");
}

export async function updateServiceAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = formData.get("id") as string;
  const parsed = await parseServiceForm(formData).catch((cause: unknown) => {
    errorRedirect(`/admin/servicos/${id}/editar`, cause instanceof Error ? cause.message : "Não foi possível salvar a foto.");
  });
  if (!parsed.success) {
    errorRedirect(`/admin/servicos/${id}/editar`, parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }
  await updateService(id, parsed.data);
  revalidatePath("/admin/servicos");
  revalidatePath("/");
  redirect("/admin/servicos");
}

export async function toggleServiceActiveAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = formData.get("id") as string;
  const active = formData.get("active") === "true";
  await setServiceActive(id, active);
  revalidatePath("/admin/servicos");
  revalidatePath("/");
  redirect("/admin/servicos");
}
