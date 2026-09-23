import type { Metadata } from "next";
import { Playfair_Display, Work_Sans } from "next/font/google";
import { getSiteContent } from "@/server/site-content";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-worksans",
  subsets: ["latin"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return {
    title: site.seo.title,
    description: site.seo.description,
    openGraph: {
      title: site.seo.title,
      description: site.seo.description,
      siteName: site.brand.name,
      locale: "pt_BR",
      type: "website",
      images: site.hero.imagePath ? [{ url: site.hero.imagePath, alt: site.hero.imageAlt }] : [],
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-ink">
        {children}
      </body>
    </html>
  );
}
