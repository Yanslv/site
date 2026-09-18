import type { Metadata } from "next";
import { Playfair_Display, Work_Sans } from "next/font/google";
import { seo, brand } from "@/config/site";
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

export const metadata: Metadata = {
  title: seo.title,
  description: seo.description,
  ...(seo.canonicalUrl ? { alternates: { canonical: seo.canonicalUrl } } : {}),
  openGraph: {
    title: seo.title,
    description: seo.description,
    siteName: brand.name,
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: seo.ogImage.src,
        width: seo.ogImage.width,
        height: seo.ogImage.height,
        alt: seo.ogImage.alt,
      },
    ],
  },
};

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
