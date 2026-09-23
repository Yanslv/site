import "server-only";
import { cache } from "react";
import { getSetting, setSetting } from "@/lib/settings";
import {
  defaultSiteContent,
  parseSiteContent,
  type SiteContent,
  type SiteSection,
} from "@/lib/site-content";

const SITE_CONTENT_KEY = "siteContent";

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  try {
    return parseSiteContent(await getSetting(SITE_CONTENT_KEY));
  } catch {
    return defaultSiteContent;
  }
});

export async function saveSiteContent(content: SiteContent): Promise<void> {
  await setSetting(SITE_CONTENT_KEY, JSON.stringify(content));
}

export async function saveSiteSection<K extends SiteSection>(
  section: K,
  value: SiteContent[K]
): Promise<void> {
  const current = await getSiteContent();
  await saveSiteContent({ ...current, [section]: value });
}
