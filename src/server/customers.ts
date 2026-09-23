import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/db/client";
import { customers, type Customer } from "@/db/schema";
import { whatsappToCanonical } from "@/lib/masks";

export async function findOrCreateCustomer(input: {
  name: string;
  whatsapp: string;
  email?: string | null;
}): Promise<Customer> {
  const normalized = whatsappToCanonical(input.whatsapp);
  const [existing] = await db
    .select()
    .from(customers)
    .where(eq(customers.whatsapp, normalized))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(customers)
      .set({
        name: input.name,
        whatsapp: normalized,
        email: input.email || existing.email,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, existing.id))
      .returning();
    return updated;
  }

  const now = new Date();
  const [created] = await db
    .insert(customers)
    .values({
      id: randomUUID(),
      name: input.name,
      whatsapp: normalized,
      email: input.email || null,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return created;
}

export async function listCustomers(search?: string): Promise<Customer[]> {
  const realCustomers = eq(customers.isDemo, false);
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    return db
      .select()
      .from(customers)
      .where(and(realCustomers, or(like(customers.name, term), like(customers.whatsapp, term))))
      .orderBy(desc(customers.createdAt));
  }
  return db.select().from(customers).where(realCustomers).orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return row ?? null;
}
