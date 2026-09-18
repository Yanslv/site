"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, CalendarDays } from "lucide-react";
import { brand, navLinks } from "@/config/site";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-surface/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        {/* Marca tipográfica provisória — substituir por <Image> com a logo oficial (PNG/SVG) quando recebida. */}
        <a href="#hero" className="flex flex-col leading-none">
          <span className="font-serif-display text-xl font-semibold text-wine sm:text-2xl">
            {brand.name}
          </span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-ink/60 sm:text-xs">
            por {brand.professional}
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink/80 transition-colors hover:text-wine"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/agendar"
            className="inline-flex items-center gap-2 rounded-full bg-wine px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-ink"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Agendar serviço
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-2 text-ink hover:bg-surface md:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMenuOpen && (
        <nav
          id="mobile-menu"
          className="border-t border-surface/70 bg-background px-4 pb-6 pt-2 md:hidden"
          aria-label="Navegação mobile"
        >
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-lg px-2 py-3 text-base font-medium text-ink/80 hover:bg-surface hover:text-wine"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Link
              href="/agendar"
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-wine px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-ink"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Agendar serviço
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
