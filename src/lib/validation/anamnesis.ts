import { z } from "zod";
import {
  AUTHORIZATION_ITEMS,
  CONSENT_ITEMS,
  HEALTH_ITEMS,
  type AnamnesisPayload,
} from "@/lib/anamnesis";
import { isCanonicalWhatsapp, whatsappToCanonical } from "@/lib/masks";

const healthFlagSchema = z.object({
  checked: z.boolean(),
  note: z.string().trim().max(300),
});

const signatureSchema = z
  .string()
  .max(180_000, "Assinatura muito grande. Limpe e assine de novo.")
  .refine((value) => value === "" || value.startsWith("data:image/png;base64,"), "Assinatura inválida.");

const healthShape = Object.fromEntries(HEALTH_ITEMS.map((item) => [item.key, healthFlagSchema]));
const authorizationShape = Object.fromEntries(AUTHORIZATION_ITEMS.map((item) => [item.key, z.boolean()]));
const consentShape = Object.fromEntries(CONSENT_ITEMS.map((item) => [item.key, z.boolean()]));

export const anamnesisPayloadSchema = z.object({
  client: z.object({
    name: z.string().trim().max(120),
    birthDate: z.string().trim().max(10),
    rg: z.string().trim().max(20),
    cpf: z.string().trim().max(14),
    address: z.string().trim().max(200),
    city: z.string().trim().max(80),
    state: z.string().trim().max(2),
    phone: z.string().trim().max(20),
  }),
  referral: z.enum(["", "internet", "indicacao", "outros"]),
  referralOther: z.string().trim().max(120),
  procedures: z.array(z.enum(["sobrancelhas", "labios", "olhos", "outro"])).max(4),
  procedureOther: z.string().trim().max(120),
  pigment: z.object({
    brand: z.string().trim().max(80),
    colors: z.array(z.string().trim().max(40)).max(12),
  }),
  needle: z.object({
    type: z.string().trim().max(80),
    speed: z.string().trim().max(40),
  }),
  health: z.object(healthShape),
  medications: z.string().trim().max(500),
  lactation: healthFlagSchema,
  otherConditions: z.string().trim().max(500),
  fitForProcedure: z.enum(["", "yes", "no"]),
  fitNotes: z.string().trim().max(500),
  authorization: z.object(authorizationShape),
  consent: z.object(consentShape),
  finalDeclaration: z.boolean(),
  clientSignature: signatureSchema,
  professionalSignature: signatureSchema,
  signedAt: z.string().trim().max(10),
});

function issue(ctx: z.RefinementCtx, message: string, path: (string | number)[]) {
  ctx.addIssue({ code: "custom", message, path });
}

export const anamnesisCompleteSchema = anamnesisPayloadSchema.superRefine((data, ctx) => {
  const payload = data as AnamnesisPayload;
  if (payload.client.name.trim().length < 2) issue(ctx, "Informe o nome da cliente.", ["client", "name"]);
  if (!isCanonicalWhatsapp(whatsappToCanonical(payload.client.phone))) {
    issue(ctx, "Informe um telefone válido, com DDD.", ["client", "phone"]);
  }
  if (payload.client.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(payload.client.birthDate)) {
    issue(ctx, "Data de nascimento inválida.", ["client", "birthDate"]);
  }
  if (payload.procedures.length === 0) issue(ctx, "Selecione ao menos um tipo de procedimento.", ["procedures"]);
  if (payload.procedures.includes("outro") && !payload.procedureOther.trim()) {
    issue(ctx, "Descreva o outro procedimento.", ["procedureOther"]);
  }
  if (payload.fitForProcedure !== "yes" && payload.fitForProcedure !== "no") {
    issue(ctx, "Marque se a cliente está apta a realizar o procedimento.", ["fitForProcedure"]);
  }
  for (const item of AUTHORIZATION_ITEMS) {
    if (!payload.authorization[item.key]) issue(ctx, "Os aceites dos termos são obrigatórios.", ["authorization", item.key]);
  }
  for (const item of CONSENT_ITEMS) {
    if (!payload.consent[item.key]) issue(ctx, "Os aceites dos termos são obrigatórios.", ["consent", item.key]);
  }
  if (!payload.finalDeclaration) issue(ctx, "A declaração final é obrigatória.", ["finalDeclaration"]);
  if (!payload.clientSignature) issue(ctx, "A assinatura da cliente é obrigatória.", ["clientSignature"]);
  if (!payload.professionalSignature) issue(ctx, "A assinatura da profissional é obrigatória.", ["professionalSignature"]);
});

export function readStoredPayload(raw: string): AnamnesisPayload | null {
  try {
    const parsed = anamnesisPayloadSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as AnamnesisPayload) : null;
  } catch {
    return null;
  }
}
