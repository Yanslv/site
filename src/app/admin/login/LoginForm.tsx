"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/app/actions/auth";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginActionState, FormData>(
    loginAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink/80">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink/80">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-xl border border-surface bg-background px-3 py-2.5 text-sm focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 inline-flex items-center justify-center rounded-full bg-wine px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-ink disabled:opacity-60"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
