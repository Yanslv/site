import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do serviço").max(120),
  slug: z.string().trim().toLowerCase().regex(slugRegex, "Use apenas letras minúsculas, números e hífens"),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(5, "Duração mínima de 5 minutos").max(600),
  priceCents: z.coerce.number().int().min(0, "Preço não pode ser negativo"),
  active: z.coerce.boolean(),
  imagePath: z.string().trim().max(300).optional().or(z.literal("")),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor deve estar no formato #RRGGBB"),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
