import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, CalendarDays, Users, Sparkles, Globe, Wallet, Settings } from "lucide-react";

export type AdminNavItem = { label: string; href: string; icon: LucideIcon };

export const adminNavItems: AdminNavItem[] = [
  { label: "Visão geral", href: "/admin", icon: LayoutDashboard },
  { label: "Agenda", href: "/admin/agenda", icon: CalendarDays },
  { label: "Clientes", href: "/admin/clientes", icon: Users },
  { label: "Serviços", href: "/admin/servicos", icon: Sparkles },
  { label: "Site", href: "/admin/site", icon: Globe },
  { label: "Financeiro", href: "/admin/financeiro", icon: Wallet },
  { label: "Configurações", href: "/admin/configuracoes", icon: Settings },
];
