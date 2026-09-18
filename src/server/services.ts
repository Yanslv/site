import "server-only";
import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { services, type Service } from "@/db/schema";
import type { ServiceInput } from "@/lib/validation/service";

export async function listActiveServices(): Promise<Service[]> {
  return db
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder));
}

export async function listAllServices(): Promise<Service[]> {
  return db.select().from(services).orderBy(asc(services.sortOrder));
}

export async function getServiceById(id: string): Promise<Service | null> {
  const [row] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return row ?? null;
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const [row] = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
  return row ?? null;
}

export async function createService(input: ServiceInput): Promise<Service> {
  const now = new Date();
  const [row] = await db
    .insert(services)
    .values({
      id: randomUUID(),
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      category: input.category || null,
      durationMinutes: input.durationMinutes,
      priceCents: input.priceCents,
      active: input.active,
      imagePath: input.imagePath || null,
      color: input.color,
      sortOrder: input.sortOrder,
      isDemo: false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return row;
}

export async function updateService(id: string, input: ServiceInput): Promise<Service> {
  const [row] = await db
    .update(services)
    .set({
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      category: input.category || null,
      durationMinutes: input.durationMinutes,
      priceCents: input.priceCents,
      active: input.active,
      imagePath: input.imagePath || null,
      color: input.color,
      sortOrder: input.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(services.id, id))
    .returning();
  return row;
}

export async function setServiceActive(id: string, active: boolean): Promise<void> {
  await db.update(services).set({ active, updatedAt: new Date() }).where(eq(services.id, id));
}
