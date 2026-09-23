"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { saveAnamnesis, type SaveAnamnesisResult } from "@/server/anamnesis";

const requestSchema = z.object({
  appointmentId: z.string().trim().min(1).max(64),
  mode: z.enum(["draft", "complete"]),
  payload: z.unknown(),
});

export async function saveAnamnesisAction(input: unknown): Promise<SaveAnamnesisResult> {
  await requireUser();
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };

  const result = await saveAnamnesis(parsed.data);
  if (!result.ok) return result;

  revalidatePath("/admin");
  revalidatePath(`/admin/agendamentos/${parsed.data.appointmentId}`);
  revalidatePath(`/admin/agendamentos/${parsed.data.appointmentId}/anamnese`);
  revalidatePath("/admin/clientes", "layout");
  return result;
}
