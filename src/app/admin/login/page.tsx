import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Entrar | Painel Bendita Micro",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-surface bg-background p-8 shadow-sm">
        <p className="font-serif-display text-2xl font-semibold text-wine">Bendita Micro</p>
        <p className="mt-1 text-sm text-ink/60">Painel administrativo</p>
        <LoginForm />
      </div>
    </div>
  );
}
