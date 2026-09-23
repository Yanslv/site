import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { siteImages } from "@/db/schema";
import { encodeUploadAsWebp } from "@/lib/encode-webp";

const MAX_BYTES = 4 * 1024 * 1024;

export async function saveSiteImage(file: File): Promise<string> {
  if (file.size === 0) throw new Error("Envie uma imagem.");
  if (file.size > MAX_BYTES) throw new Error("A imagem deve ter no máximo 4 MB.");

  const webp = await encodeUploadAsWebp(new Uint8Array(await file.arrayBuffer()));
  const id = randomUUID();
  await db.insert(siteImages).values({
    id,
    mime: "image/webp",
    bytes: webp,
    createdAt: new Date(),
  });
  return `/site-media/${id}`;
}

export async function readSiteImage(id: string) {
  const [row] = await db.select().from(siteImages).where(eq(siteImages.id, id)).limit(1);
  return row ?? null;
}
