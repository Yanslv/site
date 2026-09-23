import { z } from "zod";
import {
  TRANSACTION_TYPES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  TRANSACTION_STATUSES,
} from "@/db/schema";

export const transactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES),
    amountCents: z.coerce.number().int().positive("Valor deve ser maior que zero"),
    financialDate: z.string().min(1, "Informe a data"),
    category: z.string().min(1, "Selecione a categoria"),
    description: z.string().trim().max(200).optional().or(z.literal("")),
    note: z.string().trim().max(1000).optional().or(z.literal("")),
    paymentMethod: z.enum(PAYMENT_METHODS),
    status: z.enum(TRANSACTION_STATUSES),
    appointmentId: z.string().trim().optional().or(z.literal("")),
    serviceId: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const validCategories = data.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!(validCategories as readonly string[]).includes(data.category)) {
      ctx.addIssue({
        code: "custom",
        path: ["category"],
        message: "Categoria inválida para este tipo de lançamento",
      });
    }
  });

export type TransactionInput = z.infer<typeof transactionSchema>;

export const registerPaymentSchema = z.object({
  appointmentId: z.string().min(1),
  amountCents: z.coerce.number().int().positive("Valor deve ser maior que zero"),
  paymentMethod: z.enum(PAYMENT_METHODS, { error: "Selecione a forma de pagamento" }),
  financialDate: z.string().min(1, "Informe a data"),
  note: z.preprocess((value) => (value == null ? "" : value), z.string().trim().max(1000)),
  idempotencyKey: z.string().min(1),
});

export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;
