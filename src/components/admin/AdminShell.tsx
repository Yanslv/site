"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { adminNavItems } from "./nav-items";
import { logoutAction } from "@/app/actions/auth";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Navegação do painel">
      {adminNavItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-wine text-background"
                : "text-ink/70 hover:bg-surface hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-surface bg-background px-4 py-6 md:flex">
        <div className="mb-6 px-2">
          <p className="font-serif-display text-lg font-semibold text-wine">Bendita Micro</p>
          <p className="text-xs text-ink/60">Painel · {userName}</p>
        </div>
        <NavLinks />
        <form action={logoutAction} className="mt-4">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/60 transition-colors hover:bg-surface hover:text-wine"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </form>
      </aside>

      {/* Drawer mobile */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-ink/50"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative flex w-72 max-w-[85vw] flex-col bg-background px-4 py-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-2">
              <div>
                <p className="font-serif-display text-lg font-semibold text-wine">Bendita Micro</p>
                <p className="text-xs text-ink/60">Painel · {userName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Fechar menu"
                className="rounded-full p-2 hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setIsDrawerOpen(false)} />
            <form action={logoutAction} className="mt-4">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/60 hover:bg-surface hover:text-wine"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair
              </button>
            </form>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-surface bg-background px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Abrir menu"
            className="rounded-full p-2 hover:bg-surface"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-serif-display text-base font-semibold text-wine">Bendita Micro · Painel</p>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
