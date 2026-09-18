"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { serviceSchema } from "@/lib/validation/service";
import { createService, updateService, setServiceActive } from "@/server/services";

function errorRedirect(basePath: string, message: string): never {
  redirect(`${basePath}?erro=${encodeURIComponent(message)}`);
}

function parseServiceForm(formData: FormData) {
  return serviceSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    category: formData.get("category"),
    durationMinutes: formData.get("durationMinutes"),
    priceCents: formData.get("priceCents"),
    active: formData.get("active") === "on",
    imagePath: formData.get("imagePath"),
    color: formData.get("color"),
    sortOrder: formData.get("sortOrder"),
  });
}

export async function createServiceAction(formData: FormData): Promise<void> {
  await requireUser();
  const parsed = parseServiceForm(formData);
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
  const parsed = parseServiceForm(formData);
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
