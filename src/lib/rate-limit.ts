import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { rateLimitHits } from "@/db/schema";

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

/**
 * Rate limit simples baseado em banco (necessário porque funções serverless
 * na Vercel não compartilham memória de processo entre invocações).
 * Janela fixa: `key` some, se ultrapassa `limit` chamadas dentro de
 * `windowSeconds`, novas chamadas são bloqueadas até a janela expirar.
 */
export async function checkRateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number }
): Promise<RateLimitResult> {
  const now = new Date();
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const windowStartSeconds = Math.floor(nowSeconds / windowSeconds) * windowSeconds;
  const windowStart = new Date(windowStartSeconds * 1000);

  const [existing] = await db
    .select()
    .from(rateLimitHits)
    .where(eq(rateLimitHits.key, key))
    .limit(1);

  if (!existing || existing.windowStart.getTime() !== windowStart.getTime()) {
    await db
      .insert(rateLimitHits)
      .values({ key, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: rateLimitHits.key,
        set: { windowStart, count: 1 },
      });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = windowStartSeconds + windowSeconds - nowSeconds;
    return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 1) };
  }

  await db
    .update(rateLimitHits)
    .set({ count: existing.count + 1 })
    .where(eq(rateLimitHits.key, key));

  return { allowed: true, retryAfterSeconds: 0 };
}
